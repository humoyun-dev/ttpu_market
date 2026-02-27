import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramApiService } from '../../telegram/telegram-api.service';
import { isSupportedLanguage } from '../../common/i18n';
import { CommandsHandler } from './commands.handler';

type TelegramCallbackQuery = {
  id?: string;
  data?: string;
  from?: {
    id?: number;
    language_code?: string;
  };
  message?: {
    chat?: { id?: number };
  };
};

@Injectable()
export class CallbackHandler {
  private readonly logger = new Logger(CallbackHandler.name);
  private hasLoggedMissingToken = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramApi: TelegramApiService,
    private readonly commandsHandler: CommandsHandler,
  ) {}

  async handle(callbackQuery: TelegramCallbackQuery): Promise<void> {
    const callbackQueryId = callbackQuery.id;
    if (!callbackQueryId) {
      return;
    }

    const botToken = this.getBotToken();
    if (!botToken) {
      return;
    }

    await this.telegramApi.answerCallbackQuery(botToken, callbackQueryId, { showAlert: false });

    const callbackData = callbackQuery.data;
    const chatId = callbackQuery.message?.chat?.id;
    const telegramUserId = callbackQuery.from?.id;
    const fallbackLanguage = callbackQuery.from?.language_code;

    if (!callbackData) {
      return;
    }

    const [scope, action, value] = callbackData.split(':');
    if (scope !== 'seller') {
      return;
    }

    if (action === 'lang' && isSupportedLanguage(value)) {
      await this.commandsHandler.handleLanguageSelection(chatId, telegramUserId, value);
      return;
    }

    if (action === 'menu') {
      await this.commandsHandler.handleMenuAction(chatId, telegramUserId, value, fallbackLanguage);
      return;
    }

    await this.commandsHandler.handleMenuAction(chatId, telegramUserId, value, fallbackLanguage);
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
}
