import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/redis/redis.service';
import { CallbackHandler } from './handlers/callback.handler';
import { MessageHandler } from './handlers/message.handler';

type TelegramUpdate = {
  update_id?: number;
  message?: {
    text?: string;
    chat?: { id?: number; type?: string };
    from?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    contact?: {
      user_id?: number;
      phone_number?: string;
    };
  };
  callback_query?: {
    id?: string;
    data?: string;
    from?: {
      id?: number;
      language_code?: string;
    };
    message?: {
      chat?: { id?: number; type?: string };
    };
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
    const chat = this.readChat(message.chat);
    const from = this.readUser(message.from);
    const contact = this.readContact(message.contact);

    return { text, chat, from, contact };
  }

  private readCallbackQuery(rawCallbackQuery: unknown): TelegramUpdate['callback_query'] | undefined {
    if (!rawCallbackQuery || typeof rawCallbackQuery !== 'object') {
      return undefined;
    }

    const callbackQuery = rawCallbackQuery as Record<string, unknown>;
    const id = typeof callbackQuery.id === 'string' ? callbackQuery.id : undefined;
    const data = typeof callbackQuery.data === 'string' ? callbackQuery.data : undefined;
    const from = this.readCallbackUser(callbackQuery.from);
    const message =
      callbackQuery.message && typeof callbackQuery.message === 'object'
        ? {
            chat: this.readChat((callbackQuery.message as Record<string, unknown>).chat),
          }
        : undefined;
    return { id, data, from, message };
  }

  private readChat(rawChat: unknown): { id?: number; type?: string } | undefined {
    if (!rawChat || typeof rawChat !== 'object') {
      return undefined;
    }

    const chat = rawChat as Record<string, unknown>;
    return {
      id: typeof chat.id === 'number' ? chat.id : undefined,
      type: typeof chat.type === 'string' ? chat.type : undefined,
    };
  }

  private readUser(
    rawUser: unknown,
  ):
    | {
        id?: number;
        first_name?: string;
        last_name?: string;
        username?: string;
        language_code?: string;
      }
    | undefined {
    if (!rawUser || typeof rawUser !== 'object') {
      return undefined;
    }

    const user = rawUser as Record<string, unknown>;
    return {
      id: typeof user.id === 'number' ? user.id : undefined,
      first_name: typeof user.first_name === 'string' ? user.first_name : undefined,
      last_name: typeof user.last_name === 'string' ? user.last_name : undefined,
      username: typeof user.username === 'string' ? user.username : undefined,
      language_code:
        typeof user.language_code === 'string' ? user.language_code : undefined,
    };
  }

  private readCallbackUser(
    rawUser: unknown,
  ): { id?: number; language_code?: string } | undefined {
    if (!rawUser || typeof rawUser !== 'object') {
      return undefined;
    }

    const user = rawUser as Record<string, unknown>;
    return {
      id: typeof user.id === 'number' ? user.id : undefined,
      language_code:
        typeof user.language_code === 'string' ? user.language_code : undefined,
    };
  }

  private readContact(rawContact: unknown): { user_id?: number; phone_number?: string } | undefined {
    if (!rawContact || typeof rawContact !== 'object') {
      return undefined;
    }

    const contact = rawContact as Record<string, unknown>;
    return {
      user_id: typeof contact.user_id === 'number' ? contact.user_id : undefined,
      phone_number:
        typeof contact.phone_number === 'string' ? contact.phone_number : undefined,
    };
  }
}
