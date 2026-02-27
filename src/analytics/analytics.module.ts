import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { StoresModule } from '../stores/stores.module';
import { EventsService } from './events.service';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [PrismaModule, StoresModule],
  providers: [EventsService, AnalyticsService],
  controllers: [AnalyticsController],
  exports: [EventsService],
})
export class AnalyticsModule {}
