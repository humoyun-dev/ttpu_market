import { Module } from '@nestjs/common';
import { RedisModule } from '../common/redis/redis.module';
import { TelegramModule } from '../telegram/telegram.module';
import { CallbackHandler } from './handlers/callback.handler';
import { CommandsHandler } from './handlers/commands.handler';
import { MessageHandler } from './handlers/message.handler';
import { SellerBotStateMachine } from './fsm/state-machine';
import { SellerBotController } from './seller-bot.controller';
import { SellerBotService } from './seller-bot.service';
import { SellerBotWebhookSyncService } from './seller-bot-webhook-sync.service';

@Module({
  imports: [RedisModule, TelegramModule],
  controllers: [SellerBotController],
  providers: [
    SellerBotService,
    SellerBotStateMachine,
    CommandsHandler,
    MessageHandler,
    CallbackHandler,
    SellerBotWebhookSyncService,
  ],
})
export class SellerBotModule {}
