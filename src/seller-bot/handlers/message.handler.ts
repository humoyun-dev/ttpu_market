import { Injectable } from '@nestjs/common';
import { CommandsHandler } from './commands.handler';

type TelegramMessage = {
  text?: string;
  chat?: { id?: number };
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

@Injectable()
export class MessageHandler {
  constructor(private readonly commandsHandler: CommandsHandler) {}

  async handle(message: TelegramMessage): Promise<void> {
    const text = message.text?.trim();

    if (message.contact) {
      await this.commandsHandler.handleContactMessage(message);
      return;
    }

    if (text?.startsWith('/')) {
      await this.commandsHandler.handleCommand(message);
      return;
    }

    await this.commandsHandler.handlePlainMessage(message);
  }
}
