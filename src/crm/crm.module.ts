import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { BroadcastProcessor } from './broadcast.processor';
import { StoresModule } from '../stores/stores.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'broadcast',
    }),
    StoresModule,
    forwardRef(() => TelegramModule),
  ],
  controllers: [CrmController],
  providers: [CrmService, BroadcastProcessor],
  exports: [CrmService],
})
export class CrmModule {}
