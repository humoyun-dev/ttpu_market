import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { TelegramApiService } from './telegram-api.service';
import { ConnectTelegramDto } from './dto';
import { encrypt, decrypt, generateRandomSecret } from '../common/utils';

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly telegramApi: TelegramApiService,
  ) {}

  async connect(storeId: bigint, dto: ConnectTelegramDto) {
    // Validate the token by calling getMe
    const botInfo = await this.telegramApi.getMe(dto.token);

    if (!botInfo.is_bot) {
      throw new BadRequestException('The provided token is not a bot token');
    }

    // Get encryption key
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey || encryptionKey.length !== 64) {
      throw new BadRequestException('Invalid encryption key configuration');
    }

    // Encrypt the token
    const encryptedToken = encrypt(dto.token, encryptionKey);

    // Generate webhook secret
    const webhookSecret = generateRandomSecret(16);

    // Determine webhook URL
    const webhookBaseUrl =
      dto.webhookBaseUrl || this.configService.get<string>('TELEGRAM_WEBHOOK_BASE_URL');
    const webhookUrl = `${webhookBaseUrl}/telegram/webhook/${storeId}`;

    // Set webhook
    await this.telegramApi.setWebhook(dto.token, webhookUrl, webhookSecret);

    // Check if bot already exists for this store
    const existingBot = await this.prisma.telegramBot.findUnique({
      where: { storeId },
    });

    let telegramBot;
    if (existingBot) {
      // Update existing bot
      telegramBot = await this.prisma.telegramBot.update({
        where: { storeId },
        data: {
          botId: BigInt(botInfo.id),
          username: botInfo.username || '',
          encryptedToken,
          webhookSecret,
          webhookUrl,
          isActive: true,
        },
      });
    } else {
      // Create new bot
      telegramBot = await this.prisma.telegramBot.create({
        data: {
          storeId,
          botId: BigInt(botInfo.id),
          username: botInfo.username || '',
          encryptedToken,
          webhookSecret,
          webhookUrl,
          isActive: true,
        },
      });
    }

    return {
      id: telegramBot.id.toString(),
      botId: telegramBot.botId.toString(),
      username: telegramBot.username,
      webhookStatus: 'active',
      isActive: telegramBot.isActive,
    };
  }

  async getBotStatus(storeId: bigint) {
    const bot = await this.prisma.telegramBot.findUnique({
      where: { storeId },
    });

    if (!bot) {
      throw new NotFoundException('No Telegram bot connected to this store');
    }

    return {
      id: bot.id.toString(),
      botId: bot.botId.toString(),
      username: bot.username,
      webhookStatus: bot.isActive ? 'active' : 'inactive',
      isActive: bot.isActive,
    };
  }

  async disconnect(storeId: bigint): Promise<{ disconnected: boolean }> {
    const bot = await this.prisma.telegramBot.findUnique({
      where: { storeId },
    });

    if (!bot) {
      return { disconnected: true };
    }

    try {
      const token = await this.getDecryptedToken(storeId);
      await this.telegramApi.deleteWebhook(token);
    } catch (error) {
      this.logger.warn(`Failed to delete Telegram webhook for store ${storeId}`);
    }

    await this.prisma.telegramBot.update({
      where: { storeId },
      data: { isActive: false },
    });

    return { disconnected: true };
  }

  async getDecryptedToken(storeId: bigint): Promise<string> {
    const bot = await this.prisma.telegramBot.findUnique({
      where: { storeId },
    });

    if (!bot) {
      throw new NotFoundException('No Telegram bot connected to this store');
    }

    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new BadRequestException('Encryption key not configured');
    }

    return decrypt(bot.encryptedToken, encryptionKey);
  }

  async validateWebhookSecret(storeId: bigint, secret: string): Promise<boolean> {
    const bot = await this.prisma.telegramBot.findUnique({
      where: { storeId },
    });

    if (!bot) {
      return false;
    }

    return bot.webhookSecret === secret;
  }
}
