import { Controller, Get, Put, Post, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentProvider } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { UpdatePaymentSettingsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { StoresService } from '../stores/stores.service';

@ApiTags('Payments')
@Controller()
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly storesService: StoresService,
  ) {}

  @Get('stores/:storeId/payments/settings/:provider')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment settings for a provider' })
  @ApiResponse({ status: 200, description: 'Payment settings' })
  async getSettings(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('provider') provider: PaymentProvider,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.paymentsService.getSettings(BigInt(storeId), provider);
  }

  @Put('stores/:storeId/payments/settings/:provider')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment settings for a provider' })
  @ApiResponse({ status: 200, description: 'Payment settings updated' })
  async updateSettings(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('provider') provider: PaymentProvider,
    @Body() dto: UpdatePaymentSettingsDto,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.paymentsService.updateSettings(BigInt(storeId), provider, dto);
  }

  @Post('payments/payme/callback')
  @HttpCode(200)
  @ApiOperation({ summary: 'Payme payment callback' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async paymeCallback(@Body() payload: any) {
    return this.paymentsService.handlePaymeCallback(payload);
  }

  @Post('payments/click/callback')
  @HttpCode(200)
  @ApiOperation({ summary: 'Click payment callback' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async clickCallback(@Body() payload: any) {
    return this.paymentsService.handleClickCallback(payload);
  }
}
