import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { I18nModule } from './common/i18n';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { TelegramModule } from './telegram/telegram.module';
import { CatalogModule } from './catalog/catalog.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { DeliveryModule } from './delivery/delivery.module';
import { CouponsModule } from './coupons/coupons.module';
import { CrmModule } from './crm/crm.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SellerBotModule } from './seller-bot/seller-bot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: new URL(configService.get('REDIS_URL') || 'redis://localhost:6379').hostname,
          port: parseInt(
            new URL(configService.get('REDIS_URL') || 'redis://localhost:6379').port || '6379',
          ),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    RedisModule,
    I18nModule,
    HealthModule,
    AuthModule,
    StoresModule,
    TelegramModule,
    CatalogModule,
    OrdersModule,
    PaymentsModule,
    DeliveryModule,
    CouponsModule,
    CrmModule,
    AnalyticsModule,
    SellerBotModule,
  ],
})
export class AppModule {}
