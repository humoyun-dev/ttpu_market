import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService, type AppLanguage } from '../../common/i18n';
import { TelegramApiService } from '../../telegram/telegram-api.service';
import { SellerRegistrationService } from '../seller-registration.service';

type TelegramMessage = {
  chat?: { id?: number; type?: string };
  from?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  text?: string;
  contact?: {
    user_id?: number;
    phone_number?: string;
  };
};

@Injectable()
export class CommandsHandler {
  private readonly logger = new Logger(CommandsHandler.name);
  private hasLoggedMissingToken = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramApi: TelegramApiService,
    private readonly registrationService: SellerRegistrationService,
    private readonly i18nService: I18nService,
  ) {}

  async handleCommand(message: TelegramMessage): Promise<void> {
    const command = message.text?.trim();
    if (command === '/start') {
      await this.handleStart(message);
      return;
    }

    await this.sendText(
      message.chat?.id,
      this.i18nService.t('common.errors.unsupportedAction', message.from?.language_code),
    );
  }

  async handleContactMessage(message: TelegramMessage): Promise<void> {
    const chatId = message.chat?.id;
    const from = message.from;
    const contact = message.contact;
    if (!chatId || !from?.id || !contact?.phone_number || !contact.user_id) {
      return;
    }

    try {
      const result = await this.registrationService.completeContact({
        telegramUserId: String(from.id),
        contactUserId: String(contact.user_id),
        phone: contact.phone_number,
        firstName: from.first_name || 'Seller',
        lastName: from.last_name,
        username: from.username,
      });

      const language = this.i18nService.resolveLanguage(result.languageCode);
      await this.sendText(
        chatId,
        this.i18nService.t('seller.registration.complete', language),
        { remove_keyboard: true },
      );
      await this.showMainMenu(chatId, language);
    } catch {
      const language = this.i18nService.resolveLanguage(from.language_code);
      await this.sendText(chatId, this.i18nService.t('common.errors.invalidContactOwner', language));
      await this.promptContact(chatId, language);
    }
  }

  async handlePlainMessage(message: TelegramMessage): Promise<void> {
    const chatId = message.chat?.id;
    const from = message.from;
    if (!chatId || !from?.id) {
      return;
    }

    const state = await this.registrationService.getState(String(from.id));
    const language = this.i18nService.resolveLanguage(
      state.languageCode,
      this.i18nService.resolveLanguage(from.language_code),
    );

    if (state.state === 'REGISTERED') {
      await this.showMainMenu(chatId, language);
      return;
    }

    if (state.state === 'AWAITING_CONTACT') {
      await this.promptContact(chatId, language);
      return;
    }

    await this.sendText(chatId, this.i18nService.t('common.errors.registrationRequired', language));
    await this.showLanguagePicker(chatId, language);
  }

  private async handleStart(message: TelegramMessage): Promise<void> {
    const chatId = message.chat?.id;
    const from = message.from;
    if (!chatId || !from?.id) {
      return;
    }

    const state = await this.registrationService.start({
      telegramUserId: String(from.id),
      firstName: from.first_name || 'Seller',
      lastName: from.last_name,
      username: from.username,
    });

    const language = this.i18nService.resolveLanguage(
      state.languageCode,
      this.i18nService.resolveLanguage(from.language_code),
    );

    if (state.state === 'REGISTERED') {
      await this.showMainMenu(chatId, language);
      return;
    }

    await this.showLanguagePicker(chatId, language);
  }

  async handleLanguageSelection(
    chatId: number | undefined,
    telegramUserId: number | undefined,
    languageCode: AppLanguage,
  ): Promise<void> {
    if (!chatId || !telegramUserId) {
      return;
    }

    const state = await this.registrationService.selectLanguage({
      telegramUserId: String(telegramUserId),
      languageCode,
    });

    const language = this.i18nService.resolveLanguage(state.languageCode, languageCode);

    if (state.state === 'REGISTERED') {
      await this.sendText(chatId, this.i18nService.t('seller.info.chooseLanguage', language));
      await this.showMainMenu(chatId, language);
      return;
    }

    await this.promptContact(chatId, language);
  }

  async handleMenuAction(
    chatId: number | undefined,
    telegramUserId: number | undefined,
    action: string | undefined,
    fallbackLanguage?: string,
  ): Promise<void> {
    if (!chatId || !telegramUserId) {
      return;
    }

    const state = await this.registrationService.getState(String(telegramUserId));
    const language = this.i18nService.resolveLanguage(
      state.languageCode,
      this.i18nService.resolveLanguage(fallbackLanguage),
    );

    if (state.state !== 'REGISTERED') {
      await this.sendText(chatId, this.i18nService.t('common.errors.registrationRequired', language));
      if (state.state === 'AWAITING_CONTACT') {
        await this.promptContact(chatId, language);
      } else {
        await this.showLanguagePicker(chatId, language);
      }
      return;
    }

    if (action === 'language') {
      await this.showLanguagePicker(chatId, language);
      return;
    }

    await this.sendText(chatId, this.i18nService.t('seller.info.notImplemented', language));
    await this.showMainMenu(chatId, language);
  }

  private async showLanguagePicker(chatId: number, language: AppLanguage): Promise<void> {
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: this.i18nService.t('common.language.uz', language),
            callback_data: 'seller:lang:uz',
          },
          {
            text: this.i18nService.t('common.language.ru', language),
            callback_data: 'seller:lang:ru',
          },
          {
            text: this.i18nService.t('common.language.en', language),
            callback_data: 'seller:lang:en',
          },
        ],
      ],
    };

    await this.sendText(
      chatId,
      this.i18nService.t('seller.registration.selectLanguage', language),
      keyboard,
    );
  }

  private async promptContact(chatId: number, language: AppLanguage): Promise<void> {
    const keyboard = {
      keyboard: [
        [
          {
            text: this.i18nService.t('common.actions.shareContact', language),
            request_contact: true,
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    };

    await this.sendText(
      chatId,
      this.i18nService.t('seller.registration.shareContact', language),
      keyboard,
    );
  }

  private async showMainMenu(chatId: number, language: AppLanguage): Promise<void> {
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: this.i18nService.t('seller.menu.stores', language),
            callback_data: 'seller:menu:stores',
          },
          {
            text: this.i18nService.t('seller.menu.products', language),
            callback_data: 'seller:menu:products',
          },
        ],
        [
          {
            text: this.i18nService.t('seller.menu.orders', language),
            callback_data: 'seller:menu:orders',
          },
          {
            text: this.i18nService.t('seller.menu.connectBot', language),
            callback_data: 'seller:menu:connect_bot',
          },
        ],
        [
          {
            text: this.i18nService.t('seller.menu.language', language),
            callback_data: 'seller:menu:language',
          },
        ],
      ],
    };

    await this.sendText(chatId, this.i18nService.t('seller.menu.title', language), keyboard);
  }

  private getBotToken(): string | null {
    const token = this.configService.get<string>('SELLER_BOT_TOKEN');
    if (token && token.length > 0) {
      return token;
    }

    if (!this.hasLoggedMissingToken) {
      this.logger.error('SELLER_BOT_TOKEN is not configured.');
      this.hasLoggedMissingToken = true;
    }
    return null;
  }

  private async sendText(chatId: number | undefined, text: string, replyMarkup?: unknown): Promise<void> {
    if (!chatId) {
      return;
    }

    const botToken = this.getBotToken();
    if (!botToken) {
      return;
    }

    await this.telegramApi.sendMessage(botToken, chatId, text, {
      replyMarkup,
    });
  }
}
