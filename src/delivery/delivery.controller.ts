import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import {
  CreateStoreLocationDto,
  UpdateStoreLocationDto,
  CreateDeliveryZoneDto,
  UpdateDeliveryZoneDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { StoresService } from '../stores/stores.service';

@ApiTags('Delivery')
@Controller('stores/:storeId')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly storesService: StoresService,
  ) {}

  // Store Locations
  @Post('locations')
  @ApiOperation({ summary: 'Create a store location' })
  @ApiResponse({ status: 201, description: 'Location created' })
  async createLocation(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Body() dto: CreateStoreLocationDto,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.deliveryService.createLocation(BigInt(storeId), dto);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get all store locations' })
  @ApiResponse({ status: 200, description: 'List of locations' })
  async getLocations(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.deliveryService.getLocations(BigInt(storeId));
  }

  @Get('locations/:locationId')
  @ApiOperation({ summary: 'Get a store location' })
  @ApiResponse({ status: 200, description: 'Location details' })
  async getLocation(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('locationId') locationId: string,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.deliveryService.getLocation(BigInt(storeId), BigInt(locationId));
  }

  @Patch('locations/:locationId')
  @ApiOperation({ summary: 'Update a store location' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  async updateLocation(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('locationId') locationId: string,
    @Body() dto: UpdateStoreLocationDto,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.deliveryService.updateLocation(BigInt(storeId), BigInt(locationId), dto);
  }

  @Delete('locations/:locationId')
  @ApiOperation({ summary: 'Delete a store location' })
  @ApiResponse({ status: 200, description: 'Location deleted' })
  async deleteLocation(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('locationId') locationId: string,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.deliveryService.deleteLocation(BigInt(storeId), BigInt(locationId));
  }

  // Delivery Zones
  @Post('delivery-zones')
  @ApiOperation({ summary: 'Create a delivery zone' })
  @ApiResponse({ status: 201, description: 'Zone created' })
  async createZone(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Body() dto: CreateDeliveryZoneDto,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.deliveryService.createZone(BigInt(storeId), dto);
  }

  @Get('delivery-zones')
  @ApiOperation({ summary: 'Get all delivery zones' })
  @ApiResponse({ status: 200, description: 'List of zones' })
  async getZones(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.deliveryService.getZones(BigInt(storeId));
  }

  @Get('delivery-zones/:zoneId')
  @ApiOperation({ summary: 'Get a delivery zone' })
  @ApiResponse({ status: 200, description: 'Zone details' })
  async getZone(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('zoneId') zoneId: string,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.deliveryService.getZone(BigInt(storeId), BigInt(zoneId));
  }

  @Patch('delivery-zones/:zoneId')
  @ApiOperation({ summary: 'Update a delivery zone' })
  @ApiResponse({ status: 200, description: 'Zone updated' })
  async updateZone(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('zoneId') zoneId: string,
    @Body() dto: UpdateDeliveryZoneDto,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.deliveryService.updateZone(BigInt(storeId), BigInt(zoneId), dto);
  }

  @Delete('delivery-zones/:zoneId')
  @ApiOperation({ summary: 'Delete a delivery zone' })
  @ApiResponse({ status: 200, description: 'Zone deleted' })
  async deleteZone(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('zoneId') zoneId: string,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.deliveryService.deleteZone(BigInt(storeId), BigInt(zoneId));
  }
}
