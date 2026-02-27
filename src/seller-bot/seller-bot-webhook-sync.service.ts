import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramApiService } from '../telegram/telegram-api.service';

@Injectable()
export class SellerBotWebhookSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SellerBotWebhookSyncService.name);
  private readonly maxAttempts = 3;
  private readonly retryDelayMs = 2000;

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramApiService: TelegramApiService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const token = this.configService.get<string>('SELLER_BOT_TOKEN');
    const secret = this.configService.get<string>('SELLER_BOT_WEBHOOK_SECRET');
    const baseUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_BASE_URL');

    if (!this.isValidValue(token, 'change_me_seller_bot_token')) {
      this.logger.warn('Seller bot webhook sync skipped: SELLER_BOT_TOKEN is not configured.');
      return;
    }

    if (!this.isValidValue(secret, 'change_me_seller_bot_webhook_secret')) {
      this.logger.warn(
        'Seller bot webhook sync skipped: SELLER_BOT_WEBHOOK_SECRET is not configured.',
      );
      return;
    }

    if (!this.isValidValue(baseUrl)) {
      this.logger.warn(
        'Seller bot webhook sync skipped: TELEGRAM_WEBHOOK_BASE_URL is not configured.',
      );
      return;
    }

    const normalizedBaseUrl = this.normalizeBaseUrl(baseUrl);
    if (!normalizedBaseUrl.startsWith('https://')) {
      this.logger.warn('Seller bot webhook sync skipped: webhook base URL must be HTTPS.');
      return;
    }

    const webhookUrl = `${normalizedBaseUrl}/seller-bot/webhook/${secret}`;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        await this.telegramApiService.setWebhook(token, webhookUrl);
        this.logger.log('Seller bot webhook synchronized.');
        return;
      } catch {
        if (attempt === this.maxAttempts) {
          this.logger.error('Seller bot webhook sync failed.');
          return;
        }

        this.logger.warn(
          `Seller bot webhook sync attempt ${attempt} failed, retrying in ${this.retryDelayMs}ms.`,
        );
        await this.sleep(this.retryDelayMs);
      }
    }
  }

  private normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private isValidValue(value: string | undefined, blockedValue?: string): value is string {
    if (!value || value.length === 0) {
      return false;
    }

    if (blockedValue && value === blockedValue) {
      return false;
    }

    return true;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
