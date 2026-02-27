import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import type { AppLanguage } from '../common/i18n';
import { I18nService } from '../common/i18n';
import { normalizePhoneToE164 } from '../common/utils';
import {
  CustomerLanguageSelectDto,
  CustomerRegistrationContactDto,
  CustomerRegistrationStartDto,
} from './dto';
import {
  CustomerBotState,
  CustomerRegistrationStateMachine,
} from './fsm/customer-registration-state-machine';

type SessionStateData = {
  address?: string;
};

type CustomerContext = {
  customer: {
    id: bigint;
    telegramUserId: bigint;
    languageCode: AppLanguage;
    phone: string | null;
  };
  session: {
    id: bigint;
    state: CustomerBotState;
    stateData: SessionStateData | null;
  };
};

@Injectable()
export class TelegramRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: CustomerRegistrationStateMachine,
    private readonly i18nService: I18nService,
  ) {}

  async start(storeId: bigint, dto: CustomerRegistrationStartDto) {
    const customer = await this.upsertCustomerIdentity(storeId, dto);
    const session = await this.getOrCreateSession(storeId, customer.id);
    const currentState = this.normalizeState(session.state);

    if (currentState === CustomerBotState.IDLE) {
      return {
        state: currentState,
        languageCode: customer.languageCode,
        requiresPhone: !customer.phone,
      };
    }

    if (currentState === CustomerBotState.NEW) {
      await this.transitionSession(session.id, currentState, CustomerBotState.LANG_SELECT);
      return {
        state: CustomerBotState.LANG_SELECT,
        languageCode: customer.languageCode,
        requiresPhone: !customer.phone,
      };
    }

    return {
      state: currentState,
      languageCode: customer.languageCode,
      requiresPhone: !customer.phone,
    };
  }

  async selectLanguage(storeId: bigint, dto: CustomerLanguageSelectDto) {
    const customer = await this.getCustomer(storeId, dto.telegramUserId);
    const session = await this.getOrCreateSession(storeId, customer.id);
    const currentState = this.normalizeState(session.state);

    if (currentState === CustomerBotState.NEW) {
      await this.transitionSession(session.id, currentState, CustomerBotState.LANG_SELECT);
      await this.transitionSession(
        session.id,
        CustomerBotState.LANG_SELECT,
        CustomerBotState.IDLE,
      );
    } else if (currentState === CustomerBotState.LANG_SELECT) {
      await this.transitionSession(session.id, currentState, CustomerBotState.IDLE);
    } else if (currentState !== CustomerBotState.IDLE) {
      throw new ForbiddenException(
        this.i18nService.t('common.errors.registrationRequired', customer.languageCode),
      );
    }

    const updatedCustomer = await this.prisma.telegramCustomer.update({
      where: { id: customer.id },
      data: { languageCode: dto.languageCode },
    });

    return {
      state: CustomerBotState.IDLE,
      languageCode: updatedCustomer.languageCode,
      requiresPhone: !updatedCustomer.phone,
    };
  }

  async requireContactForCheckout(storeId: bigint, telegramUserId: string) {
    const context = await this.getContext(storeId, telegramUserId);
    if (context.customer.phone) {
      await this.transitionSession(
        context.session.id,
        context.session.state,
        CustomerBotState.AWAITING_ADDRESS,
      );
      return {
        state: CustomerBotState.AWAITING_ADDRESS,
        languageCode: context.customer.languageCode,
      };
    }

    if (context.session.state === CustomerBotState.AWAITING_CONTACT) {
      return {
        state: CustomerBotState.AWAITING_CONTACT,
        languageCode: context.customer.languageCode,
      };
    }

    await this.transitionSession(
      context.session.id,
      context.session.state,
      CustomerBotState.AWAITING_CONTACT,
    );
    return {
      state: CustomerBotState.AWAITING_CONTACT,
      languageCode: context.customer.languageCode,
    };
  }

  async completeContact(storeId: bigint, dto: CustomerRegistrationContactDto) {
    if (dto.contactUserId !== dto.telegramUserId) {
      throw new ForbiddenException(this.i18nService.t('common.errors.invalidContactOwner', 'uz'));
    }

    const normalizedPhone = normalizePhoneToE164(dto.phone);
    if (!normalizedPhone) {
      throw new BadRequestException(this.i18nService.t('common.errors.invalidPhone', 'uz'));
    }

    const context = await this.getContext(storeId, dto.telegramUserId);
    if (context.session.state !== CustomerBotState.AWAITING_CONTACT) {
      throw new ForbiddenException(
        this.i18nService.t('common.errors.registrationRequired', context.customer.languageCode),
      );
    }

    await this.prisma.telegramCustomer.update({
      where: { id: context.customer.id },
      data: { phone: normalizedPhone },
    });

    await this.transitionSession(
      context.session.id,
      context.session.state,
      CustomerBotState.AWAITING_ADDRESS,
    );

    return {
      state: CustomerBotState.AWAITING_ADDRESS,
      languageCode: context.customer.languageCode,
    };
  }

  async setAwaitingPayment(storeId: bigint, telegramUserId: string, address: string) {
    const context = await this.getContext(storeId, telegramUserId);
    if (context.session.state !== CustomerBotState.AWAITING_ADDRESS) {
      throw new ForbiddenException(
        this.i18nService.t('common.errors.registrationRequired', context.customer.languageCode),
      );
    }

    await this.prisma.telegramSession.update({
      where: { id: context.session.id },
      data: {
        state: CustomerBotState.AWAITING_PAYMENT,
        stateData: { address } as SessionStateData,
      },
    });

    return {
      state: CustomerBotState.AWAITING_PAYMENT,
      languageCode: context.customer.languageCode,
    };
  }

  async setIdle(storeId: bigint, telegramUserId: string) {
    const context = await this.getContext(storeId, telegramUserId);
    await this.prisma.telegramSession.update({
      where: { id: context.session.id },
      data: {
        state: CustomerBotState.IDLE,
        stateData: Prisma.JsonNull,
      },
    });
  }

  async getContext(storeId: bigint, telegramUserId: string): Promise<CustomerContext> {
    const customer = await this.getCustomer(storeId, telegramUserId);
    const session = await this.getOrCreateSession(storeId, customer.id);

    return {
      customer: {
        id: customer.id,
        telegramUserId: customer.telegramUserId,
        languageCode: customer.languageCode,
        phone: customer.phone,
      },
      session: {
        id: session.id,
        state: this.normalizeState(session.state),
        stateData: (session.stateData as SessionStateData | null) ?? null,
      },
    };
  }

  private async getCustomer(storeId: bigint, telegramUserId: string) {
    const customer = await this.prisma.telegramCustomer.findUnique({
      where: {
        storeId_telegramUserId: {
          storeId,
          telegramUserId: BigInt(telegramUserId),
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Telegram customer not found');
    }

    return customer;
  }

  private async upsertCustomerIdentity(storeId: bigint, dto: CustomerRegistrationStartDto) {
    return this.prisma.telegramCustomer.upsert({
      where: {
        storeId_telegramUserId: {
          storeId,
          telegramUserId: BigInt(dto.telegramUserId),
        },
      },
      create: {
        storeId,
        telegramUserId: BigInt(dto.telegramUserId),
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username,
        languageCode: 'uz',
        lastActiveAt: new Date(),
      },
      update: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username,
        lastActiveAt: new Date(),
      },
    });
  }

  private async getOrCreateSession(storeId: bigint, customerId: bigint) {
    const existing = await this.prisma.telegramSession.findUnique({
      where: {
        storeId_telegramCustomerId: {
          storeId,
          telegramCustomerId: customerId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.telegramSession.create({
      data: {
        storeId,
        telegramCustomerId: customerId,
        state: CustomerBotState.NEW,
      },
    });
  }

  private normalizeState(rawState: string): CustomerBotState {
    const mapped = rawState.toUpperCase();
    if (Object.values(CustomerBotState).includes(mapped as CustomerBotState)) {
      return mapped as CustomerBotState;
    }

    switch (rawState) {
      case 'idle':
        return CustomerBotState.IDLE;
      case 'awaiting_phone':
        return CustomerBotState.AWAITING_CONTACT;
      case 'awaiting_address':
        return CustomerBotState.AWAITING_ADDRESS;
      case 'awaiting_payment':
        return CustomerBotState.AWAITING_PAYMENT;
      default:
        return CustomerBotState.NEW;
    }
  }

  private async transitionSession(
    sessionId: bigint,
    from: CustomerBotState,
    to: CustomerBotState,
  ): Promise<void> {
    if (!this.stateMachine.canTransition(from, to)) {
      throw new ForbiddenException('Invalid bot state transition');
    }

    await this.prisma.telegramSession.update({
      where: { id: sessionId },
      data: {
        state: to,
        stateData: Prisma.JsonNull,
      },
    });
  }
}
