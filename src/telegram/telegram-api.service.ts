import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

interface GetMeResponse {
  ok: boolean;
  result?: TelegramUser;
  description?: string;
}

interface SetWebhookResponse {
  ok: boolean;
  description?: string;
}

interface SendMessageResponse {
  ok: boolean;
  result?: any;
  description?: string;
}

@Injectable()
export class TelegramApiService {
  private readonly logger = new Logger(TelegramApiService.name);
  private readonly baseUrl = 'https://api.telegram.org';

  constructor(private readonly configService: ConfigService) {}

  async getMe(token: string): Promise<TelegramUser> {
    const url = `${this.baseUrl}/bot${token}/getMe`;

    try {
      const response = await fetch(url);
      const data: GetMeResponse = await response.json();

      if (!data.ok || !data.result) {
        throw new BadRequestException(data.description || 'Invalid bot token');
      }

      return data.result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to validate bot token', error);
      throw new BadRequestException('Failed to validate bot token');
    }
  }

  async setWebhook(token: string, webhookUrl: string, secret?: string): Promise<boolean> {
    const url = `${this.baseUrl}/bot${token}/setWebhook`;

    const params: any = {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query'],
    };

    if (secret) {
      params.secret_token = secret;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data: SetWebhookResponse = await response.json();

      if (!data.ok) {
        this.logger.error('Failed to set webhook:', data.description);
        throw new BadRequestException(data.description || 'Failed to set webhook');
      }

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to set webhook', error);
      throw new BadRequestException('Failed to set webhook');
    }
  }

  async deleteWebhook(token: string): Promise<boolean> {
    const url = `${this.baseUrl}/bot${token}/deleteWebhook`;

    try {
      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();
      return data.ok;
    } catch (error) {
      this.logger.error('Failed to delete webhook', error);
      return false;
    }
  }

  async sendMessage(
    token: string,
    chatId: number | string,
    text: string,
    options?: {
      replyMarkup?: any;
      parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    },
  ): Promise<any> {
    const url = `${this.baseUrl}/bot${token}/sendMessage`;

    const params: any = {
      chat_id: chatId,
      text,
    };

    if (options?.replyMarkup) {
      params.reply_markup = options.replyMarkup;
    }

    if (options?.parseMode) {
      params.parse_mode = options.parseMode;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data: SendMessageResponse = await response.json();

      if (!data.ok) {
        this.logger.warn(`Failed to send message: ${data.description}`);
        return null;
      }

      return data.result;
    } catch (error) {
      this.logger.error('Failed to send message', error);
      return null;
    }
  }

  async answerCallbackQuery(
    token: string,
    callbackQueryId: string,
    options?: { text?: string; showAlert?: boolean },
  ): Promise<boolean> {
    const url = `${this.baseUrl}/bot${token}/answerCallbackQuery`;

    const params: any = {
      callback_query_id: callbackQueryId,
    };

    if (options?.text) {
      params.text = options.text;
    }

    if (options?.showAlert) {
      params.show_alert = options.showAlert;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      return data.ok;
    } catch (error) {
      this.logger.error('Failed to answer callback query', error);
      return false;
    }
  }

  async editMessageText(
    token: string,
    chatId: number | string,
    messageId: number,
    text: string,
    options?: {
      replyMarkup?: any;
      parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    },
  ): Promise<any> {
    const url = `${this.baseUrl}/bot${token}/editMessageText`;

    const params: any = {
      chat_id: chatId,
      message_id: messageId,
      text,
    };

    if (options?.replyMarkup) {
      params.reply_markup = options.replyMarkup;
    }

    if (options?.parseMode) {
      params.parse_mode = options.parseMode;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      return data.ok ? data.result : null;
    } catch (error) {
      this.logger.error('Failed to edit message', error);
      return null;
    }
  }

  async sendPhoto(
    token: string,
    chatId: number | string,
    photoUrl: string,
    options?: {
      caption?: string;
      replyMarkup?: any;
      parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    },
  ): Promise<any> {
    const url = `${this.baseUrl}/bot${token}/sendPhoto`;

    const params: any = {
      chat_id: chatId,
      photo: photoUrl,
    };

    if (options?.caption) {
      params.caption = options.caption;
    }

    if (options?.replyMarkup) {
      params.reply_markup = options.replyMarkup;
    }

    if (options?.parseMode) {
      params.parse_mode = options.parseMode;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      return data.ok ? data.result : null;
    } catch (error) {
      this.logger.error('Failed to send photo', error);
      return null;
    }
  }
}
