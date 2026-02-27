import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SellerBotService } from './seller-bot.service';
import { SellerRegistrationService } from './seller-registration.service';
import {
  SellerLanguageSelectDto,
  SellerRegistrationContactDto,
  SellerRegistrationStartDto,
} from './dto/registration.dto';

@ApiTags('Seller Bot')
@Controller('seller-bot')
export class SellerBotController {
  constructor(
    private readonly sellerBotService: SellerBotService,
    private readonly sellerRegistrationService: SellerRegistrationService,
  ) {}

  @Post('webhook/:secret')
  @HttpCode(200)
  @ApiOperation({ summary: 'Seller management bot webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Update processed' })
  @ApiResponse({ status: 403, description: 'Invalid webhook secret' })
  async handleWebhook(@Param('secret') secret: string, @Body() update: unknown) {
    await this.sellerBotService.handleWebhook(secret, update);
    return { ok: true };
  }

  @Post('registration/start')
  @ApiOperation({ summary: 'Start seller bot registration flow' })
  async startRegistration(@Body() dto: SellerRegistrationStartDto) {
    return this.sellerRegistrationService.start(dto);
  }

  @Post('registration/language')
  @ApiOperation({ summary: 'Set seller registration language' })
  async setRegistrationLanguage(@Body() dto: SellerLanguageSelectDto) {
    return this.sellerRegistrationService.selectLanguage(dto);
  }

  @Post('registration/contact')
  @ApiOperation({ summary: 'Complete seller registration with contact' })
  @ApiResponse({ status: 403, description: 'Contact ownership validation failed' })
  async completeRegistration(@Body() dto: SellerRegistrationContactDto) {
    return this.sellerRegistrationService.completeContact(dto);
  }
}
