import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SellerBotService } from './seller-bot.service';

@ApiTags('Seller Bot')
@Controller('seller-bot')
export class SellerBotController {
  constructor(private readonly sellerBotService: SellerBotService) {}

  @Post('webhook/:secret')
  @HttpCode(200)
  @ApiOperation({ summary: 'Seller management bot webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Update processed' })
  @ApiResponse({ status: 403, description: 'Invalid webhook secret' })
  async handleWebhook(@Param('secret') secret: string, @Body() update: unknown) {
    await this.sellerBotService.handleWebhook(secret, update);
    return { ok: true };
  }
}

