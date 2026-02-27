import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramApiService } from '../../telegram/telegram-api.service';

type TelegramCallbackQuery = {
  id?: string;
};

@Injectable()
export class CallbackHandler {
  private readonly logger = new Logger(CallbackHandler.name);
  private hasLoggedMissingToken = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramApi: TelegramApiService,
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

    await this.telegramApi.answerCallbackQuery(botToken, callbackQueryId, {
      text: 'This action is not available yet.',
      showAlert: false,
    });
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
