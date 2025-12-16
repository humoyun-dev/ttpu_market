import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { StoresService } from '../stores/stores.service';

@ApiTags('Orders')
@Controller('stores/:storeId/orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly storesService: StoresService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders for a store' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of orders' })
  async findAll(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.ordersService.findAll(BigInt(storeId), { status, page, limit });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Order statistics' })
  async getStats(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.ordersService.getStats(BigInt(storeId));
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  async findOne(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('orderId') orderId: string,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.ordersService.findOne(BigInt(storeId), BigInt(orderId));
  }

  @Patch(':orderId/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  async updateStatus(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.ordersService.updateStatus(BigInt(storeId), BigInt(orderId), dto);
  }
}
