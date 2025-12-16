import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { EventsService } from './events.service';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [PrismaModule],
  providers: [EventsService, AnalyticsService],
  controllers: [AnalyticsController],
  exports: [EventsService],
})
export class AnalyticsModule {}
