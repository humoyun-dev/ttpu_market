import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/redis/redis.service';
import { CallbackHandler } from './handlers/callback.handler';
import { MessageHandler } from './handlers/message.handler';

type TelegramUpdate = {
  update_id?: number;
  message?: {
    text?: string;
    chat?: { id?: number };
  };
  callback_query?: {
    id?: string;
  };
};

@Injectable()
export class SellerBotService {
  private readonly logger = new Logger(SellerBotService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly messageHandler: MessageHandler,
    private readonly callbackHandler: CallbackHandler,
  ) {}

  async handleWebhook(secret: string, update: unknown): Promise<void> {
    this.validateWebhookSecret(secret);

    const parsedUpdate = this.toUpdate(update);
    if (parsedUpdate.update_id === undefined) {
      this.logger.warn('Seller bot update missing update_id. Ignored.');
      return;
    }

    const dedupeKey = `seller-bot:update:${parsedUpdate.update_id}`;
    const isNew = await this.redisService.setnx(dedupeKey, '1', 7200);
    if (!isNew) {
      return;
    }

    if (parsedUpdate.message) {
      await this.messageHandler.handle(parsedUpdate.message);
      return;
    }

    if (parsedUpdate.callback_query) {
      await this.callbackHandler.handle(parsedUpdate.callback_query);
      return;
    }
  }

  private validateWebhookSecret(incomingSecret: string): void {
    const configuredSecret = this.configService.get<string>('SELLER_BOT_WEBHOOK_SECRET');

    if (!configuredSecret || configuredSecret.length === 0) {
      throw new ForbiddenException('Seller bot webhook is not configured');
    }

    if (incomingSecret !== configuredSecret) {
      throw new ForbiddenException('Invalid seller bot webhook secret');
    }
  }

  private toUpdate(update: unknown): TelegramUpdate {
    if (!update || typeof update !== 'object') {
      return {};
    }

    const candidate = update as Record<string, unknown>;
    const updateId = typeof candidate.update_id === 'number' ? candidate.update_id : undefined;
    const message = this.readMessage(candidate.message);
    const callback = this.readCallbackQuery(candidate.callback_query);

    return {
      update_id: updateId,
      message,
      callback_query: callback,
    };
  }

  private readMessage(rawMessage: unknown): TelegramUpdate['message'] | undefined {
    if (!rawMessage || typeof rawMessage !== 'object') {
      return undefined;
    }

    const message = rawMessage as Record<string, unknown>;
    const text = typeof message.text === 'string' ? message.text : undefined;
    const rawChat = message.chat;
    const chat =
      rawChat && typeof rawChat === 'object'
        ? { id: typeof (rawChat as Record<string, unknown>).id === 'number' ? (rawChat as Record<string, unknown>).id as number : undefined }
        : undefined;

    return { text, chat };
  }

  private readCallbackQuery(rawCallbackQuery: unknown): TelegramUpdate['callback_query'] | undefined {
    if (!rawCallbackQuery || typeof rawCallbackQuery !== 'object') {
      return undefined;
    }

    const callbackQuery = rawCallbackQuery as Record<string, unknown>;
    const id = typeof callbackQuery.id === 'string' ? callbackQuery.id : undefined;
    return { id };
  }
}

