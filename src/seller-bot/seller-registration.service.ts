import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import type { AppLanguage } from '../common/i18n';
import { I18nService } from '../common/i18n';
import { normalizePhoneToE164 } from '../common/utils';
import {
  SellerLanguageSelectDto,
  SellerRegistrationContactDto,
  SellerRegistrationStartDto,
} from './dto/registration.dto';
import {
  SellerRegistrationState,
  SellerRegistrationStateMachine,
} from './fsm/registration-state-machine';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type SellerRegistrationSession = {
  state: SellerRegistrationState;
  languageCode?: AppLanguage;
};

@Injectable()
export class SellerRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly stateMachine: SellerRegistrationStateMachine,
    private readonly i18nService: I18nService,
  ) {}

  async getState(telegramUserId: string) {
    const userId = BigInt(telegramUserId);
    const seller = await this.prisma.telegramSeller.findUnique({
      where: { telegramUserId: userId },
    });

    if (seller) {
      await this.persistSession(telegramUserId, {
        state: SellerRegistrationState.REGISTERED,
        languageCode: seller.languageCode,
      });
      return {
        state: SellerRegistrationState.REGISTERED,
        languageCode: seller.languageCode,
        registered: true,
      };
    }

    const session = (await this.readSession(telegramUserId)) ?? {
      state: SellerRegistrationState.NEW,
    };
    return {
      state: session.state,
      languageCode: session.languageCode ?? 'uz',
      registered: false,
    };
  }

  async start(dto: SellerRegistrationStartDto) {
    const state = await this.getState(dto.telegramUserId);
    if (state.state === SellerRegistrationState.REGISTERED) {
      return state;
    }

    await this.transition(dto.telegramUserId, state.state, SellerRegistrationState.LANG_SELECT, {
      languageCode: state.languageCode,
    });

    return this.getState(dto.telegramUserId);
  }

  async selectLanguage(dto: SellerLanguageSelectDto) {
    const state = await this.getState(dto.telegramUserId);

    if (state.state === SellerRegistrationState.REGISTERED) {
      await this.prisma.telegramSeller.update({
        where: { telegramUserId: BigInt(dto.telegramUserId) },
        data: { languageCode: dto.languageCode },
      });
      return this.getState(dto.telegramUserId);
    }

    if (state.state === SellerRegistrationState.NEW) {
      await this.transition(dto.telegramUserId, state.state, SellerRegistrationState.LANG_SELECT, {
        languageCode: dto.languageCode,
      });
      await this.transition(
        dto.telegramUserId,
        SellerRegistrationState.LANG_SELECT,
        SellerRegistrationState.AWAITING_CONTACT,
        { languageCode: dto.languageCode },
      );
      return this.getState(dto.telegramUserId);
    }

    if (state.state === SellerRegistrationState.LANG_SELECT) {
      await this.transition(
        dto.telegramUserId,
        state.state,
        SellerRegistrationState.AWAITING_CONTACT,
        { languageCode: dto.languageCode },
      );
      return this.getState(dto.telegramUserId);
    }

    if (state.state === SellerRegistrationState.AWAITING_CONTACT) {
      await this.persistSession(dto.telegramUserId, {
        state: SellerRegistrationState.AWAITING_CONTACT,
        languageCode: dto.languageCode,
      });
      return this.getState(dto.telegramUserId);
    }

    throw new ForbiddenException(
      this.i18nService.t('common.errors.registrationRequired', dto.languageCode),
    );
  }

  async completeContact(dto: SellerRegistrationContactDto) {
    if (dto.contactUserId !== dto.telegramUserId) {
      throw new ForbiddenException(this.i18nService.t('common.errors.invalidContactOwner', 'uz'));
    }

    const normalizedPhone = normalizePhoneToE164(dto.phone);
    if (!normalizedPhone) {
      throw new BadRequestException(this.i18nService.t('common.errors.invalidPhone', 'uz'));
    }

    const state = await this.getState(dto.telegramUserId);
    if (state.state === SellerRegistrationState.REGISTERED) {
      return state;
    }

    if (
      state.state !== SellerRegistrationState.AWAITING_CONTACT
    ) {
      throw new ForbiddenException(
        this.i18nService.t('common.errors.registrationRequired', state.languageCode),
      );
    }

    const seller = await this.prisma.telegramSeller.upsert({
      where: { telegramUserId: BigInt(dto.telegramUserId) },
      create: {
        telegramUserId: BigInt(dto.telegramUserId),
        phone: normalizedPhone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username,
        languageCode: state.languageCode,
      },
      update: {
        phone: normalizedPhone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username,
      },
    });

    await this.transition(
      dto.telegramUserId,
      SellerRegistrationState.AWAITING_CONTACT,
      SellerRegistrationState.REGISTERED,
      { languageCode: seller.languageCode },
    );

    return {
      state: SellerRegistrationState.REGISTERED,
      languageCode: seller.languageCode,
      registered: true,
    };
  }

  private async transition(
    telegramUserId: string,
    from: SellerRegistrationState,
    to: SellerRegistrationState,
    payload: { languageCode?: AppLanguage },
  ): Promise<void> {
    if (!this.stateMachine.canTransition(from, to)) {
      throw new ForbiddenException(
        this.i18nService.t('common.errors.registrationRequired', payload.languageCode),
      );
    }

    await this.persistSession(telegramUserId, {
      state: to,
      languageCode: payload.languageCode,
    });
  }

  private async readSession(telegramUserId: string): Promise<SellerRegistrationSession | null> {
    const key = this.registrationKey(telegramUserId);
    const raw = await this.redisService.get(key);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as SellerRegistrationSession;
      if (!parsed.state) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private async persistSession(
    telegramUserId: string,
    session: SellerRegistrationSession,
  ): Promise<void> {
    await this.redisService.set(
      this.registrationKey(telegramUserId),
      JSON.stringify(session),
      SESSION_TTL_SECONDS,
    );
  }

  private registrationKey(telegramUserId: string): string {
    return `seller-bot:registration:${telegramUserId}`;
  }
}
