import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramWebhookService } from './telegram-webhook.service';
import {
  ConnectTelegramDto,
  CustomerLanguageSelectDto,
  CustomerRegistrationContactDto,
  CustomerRegistrationStartDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { StoresService } from '../stores/stores.service';
import { TelegramRegistrationService } from './telegram-registration.service';

function parseBigIntId(id: string): bigint {
  if (!/^\d+$/.test(id)) {
    throw new BadRequestException('Invalid ID format');
  }
  return BigInt(id);
}

@ApiTags('Telegram')
@Controller()
export class TelegramController {
  constructor(
    private readonly botService: TelegramBotService,
    private readonly webhookService: TelegramWebhookService,
    private readonly storesService: StoresService,
    private readonly registrationService: TelegramRegistrationService,
  ) {}

  @Post('stores/:storeId/telegram/connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Connect a Telegram bot to the store' })
  @ApiResponse({ status: 200, description: 'Bot connected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid bot token' })
  async connect(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Body() dto: ConnectTelegramDto,
  ) {
    const storeIdBigInt = parseBigIntId(storeId);
    await this.storesService.verifyOwnership(storeIdBigInt, BigInt(user.id));
    return this.botService.connect(storeIdBigInt, dto);
  }

  @Get('stores/:storeId/telegram/bot')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Telegram bot status' })
  @ApiResponse({ status: 200, description: 'Bot status' })
  @ApiResponse({ status: 404, description: 'Bot not found' })
  async getBotStatus(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    const storeIdBigInt = parseBigIntId(storeId);
    await this.storesService.verifyOwnership(storeIdBigInt, BigInt(user.id));
    return this.botService.getBotStatus(storeIdBigInt);
  }

  @Post('stores/:storeId/telegram/disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Telegram bot from store' })
  @ApiResponse({ status: 200, description: 'Bot disconnected' })
  async disconnect(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    const storeIdBigInt = parseBigIntId(storeId);
    await this.storesService.verifyOwnership(storeIdBigInt, BigInt(user.id));
    return this.botService.disconnect(storeIdBigInt);
  }

  @Post('stores/:storeId/telegram/registration/start')
  @ApiOperation({ summary: 'Start customer registration flow' })
  async startRegistration(
    @Param('storeId') storeId: string,
    @Body() dto: CustomerRegistrationStartDto,
  ) {
    const storeIdBigInt = parseBigIntId(storeId);
    return this.registrationService.start(storeIdBigInt, dto);
  }

  @Post('stores/:storeId/telegram/registration/language')
  @ApiOperation({ summary: 'Set customer language for Telegram store bot' })
  async setRegistrationLanguage(
    @Param('storeId') storeId: string,
    @Body() dto: CustomerLanguageSelectDto,
  ) {
    const storeIdBigInt = parseBigIntId(storeId);
    return this.registrationService.selectLanguage(storeIdBigInt, dto);
  }

  @Post('stores/:storeId/telegram/registration/contact')
  @ApiOperation({ summary: 'Complete customer contact registration for checkout' })
  @ApiResponse({ status: 403, description: 'Contact ownership validation failed' })
  async completeRegistrationContact(
    @Param('storeId') storeId: string,
    @Body() dto: CustomerRegistrationContactDto,
  ) {
    const storeIdBigInt = parseBigIntId(storeId);
    return this.registrationService.completeContact(storeIdBigInt, dto);
  }

  @Post('telegram/webhook/:storeId/:secret')
  @HttpCode(200)
  @ApiOperation({ summary: 'Telegram webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Update processed' })
  async webhook(
    @Param('storeId') storeId: string,
    @Param('secret') secret: string,
    @Body() update: any,
  ) {
    const storeIdBigInt = parseBigIntId(storeId);
    await this.webhookService.handleWebhook(storeIdBigInt, secret, update);
    return { ok: true };
  }
}
