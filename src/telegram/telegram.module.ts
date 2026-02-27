import { Module, forwardRef } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramWebhookService } from './telegram-webhook.service';
import { TelegramApiService } from './telegram-api.service';
import { TelegramRegistrationService } from './telegram-registration.service';
import { StoresModule } from '../stores/stores.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CustomerRegistrationStateMachine } from './fsm/customer-registration-state-machine';

@Module({
  imports: [StoresModule, forwardRef(() => AnalyticsModule)],
  controllers: [TelegramController],
  providers: [
    TelegramBotService,
    TelegramWebhookService,
    TelegramApiService,
    TelegramRegistrationService,
    CustomerRegistrationStateMachine,
  ],
  exports: [TelegramBotService, TelegramApiService, TelegramRegistrationService],
})
export class TelegramModule {}
