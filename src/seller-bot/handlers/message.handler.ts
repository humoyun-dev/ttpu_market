import { Injectable } from '@nestjs/common';
import { CommandsHandler } from './commands.handler';

type TelegramMessage = {
  text?: string;
  chat?: { id?: number };
};

@Injectable()
export class MessageHandler {
  constructor(private readonly commandsHandler: CommandsHandler) {}

  async handle(message: TelegramMessage): Promise<void> {
    const text = message.text?.trim();

    if (text?.startsWith('/')) {
      await this.commandsHandler.handleCommand(message);
      return;
    }

    await this.commandsHandler.handlePlainMessage(message);
  }
}

