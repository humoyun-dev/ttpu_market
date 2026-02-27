import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventsService } from './events.service';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../common/decorators';
import { StoresService } from '../stores/stores.service';

function parseBigIntId(id: string): bigint {
  if (!/^\d+$/.test(id)) {
    throw new BadRequestException('Invalid ID format');
  }
  return BigInt(id);
}

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stores/:storeId/analytics')
export class AnalyticsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly analyticsService: AnalyticsService,
    private readonly storesService: StoresService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get store dashboard analytics' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  async getDashboard(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    const storeIdBigInt = parseBigIntId(storeId);
    await this.storesService.verifyOwnership(storeIdBigInt, BigInt(user.id));
    return this.analyticsService.getDashboard(storeIdBigInt);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue chart data' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to include',
    example: 30,
  })
  async getRevenueChart(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const storeIdBigInt = parseBigIntId(storeId);
    await this.storesService.verifyOwnership(storeIdBigInt, BigInt(user.id));
    return this.analyticsService.getRevenueChart(storeIdBigInt, days);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get customer growth data' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to include',
    example: 30,
  })
  async getCustomerGrowth(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const storeIdBigInt = parseBigIntId(storeId);
    await this.storesService.verifyOwnership(storeIdBigInt, BigInt(user.id));
    return this.analyticsService.getCustomerGrowth(storeIdBigInt, days);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get store events' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 20,
  })
  @ApiQuery({
    name: 'eventName',
    required: false,
    description: 'Filter by event name',
  })
  async getEvents(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('eventName') eventName?: string,
  ) {
    const storeIdBigInt = parseBigIntId(storeId);
    await this.storesService.verifyOwnership(storeIdBigInt, BigInt(user.id));
    return this.eventsService.getEvents(storeIdBigInt, {
      page,
      limit,
      eventName,
    });
  }

  @Get('events/counts')
  @ApiOperation({ summary: 'Get event counts by type' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to include',
    example: 30,
  })
  async getEventCounts(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const storeIdBigInt = parseBigIntId(storeId);
    await this.storesService.verifyOwnership(storeIdBigInt, BigInt(user.id));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.eventsService.getEventCounts(storeIdBigInt, startDate);
  }
}
