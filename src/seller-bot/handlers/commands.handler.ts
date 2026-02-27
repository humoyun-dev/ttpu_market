import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramApiService } from '../../telegram/telegram-api.service';
import { SellerBotStateMachine } from '../fsm/state-machine';

type TelegramMessage = {
  chat?: { id?: number };
  text?: string;
};

@Injectable()
export class CommandsHandler {
  private readonly logger = new Logger(CommandsHandler.name);
  private hasLoggedMissingToken = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramApi: TelegramApiService,
    private readonly stateMachine: SellerBotStateMachine,
  ) {}

  async handleCommand(message: TelegramMessage): Promise<void> {
    const command = message.text?.trim();
    if (command === '/start') {
      await this.handleStart(message);
      return;
    }

    await this.sendText(message.chat?.id, 'Unknown command. Send /start.');
  }

  async handlePlainMessage(message: TelegramMessage): Promise<void> {
    await this.sendText(
      message.chat?.id,
      'Welcome to the seller management bot. Send /start to continue.',
    );
  }

  private async handleStart(message: TelegramMessage): Promise<void> {
    const currentState = this.stateMachine.getInitialState();
    const keyboard = {
      keyboard: [
        [{ text: 'My Stores' }, { text: 'Create Store' }],
        [{ text: 'Products' }, { text: 'Orders' }],
        [{ text: 'Connect Bot' }, { text: 'Home' }],
      ],
      resize_keyboard: true,
    };

    await this.sendText(
      message.chat?.id,
      `Seller Management Bot is active.\nState: ${currentState}.\nContact onboarding will be enabled in the next phase.`,
      keyboard,
    );
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
