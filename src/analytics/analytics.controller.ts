import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
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

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stores/:storeId/analytics')
export class AnalyticsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get store dashboard analytics' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  async getDashboard(@Param('storeId') storeId: string) {
    return this.analyticsService.getDashboard(BigInt(storeId));
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
    @Param('storeId') storeId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.analyticsService.getRevenueChart(BigInt(storeId), days);
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
    @Param('storeId') storeId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.analyticsService.getCustomerGrowth(BigInt(storeId), days);
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
    @Param('storeId') storeId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('eventName') eventName?: string,
  ) {
    return this.eventsService.getEvents(BigInt(storeId), {
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
    @Param('storeId') storeId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.eventsService.getEventCounts(BigInt(storeId), startDate);
  }
}
