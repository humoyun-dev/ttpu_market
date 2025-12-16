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
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { StoresService } from '../stores/stores.service';

@ApiTags('Coupons')
@Controller('stores/:storeId/coupons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CouponsController {
  constructor(
    private readonly couponsService: CouponsService,
    private readonly storesService: StoresService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a coupon' })
  @ApiResponse({ status: 201, description: 'Coupon created' })
  async create(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Body() dto: CreateCouponDto,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.couponsService.create(BigInt(storeId), dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all coupons' })
  @ApiResponse({ status: 200, description: 'List of coupons' })
  async findAll(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.couponsService.findAll(BigInt(storeId));
  }

  @Get(':couponId')
  @ApiOperation({ summary: 'Get a coupon by ID' })
  @ApiResponse({ status: 200, description: 'Coupon details' })
  async findOne(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('couponId') couponId: string,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.couponsService.findOne(BigInt(storeId), BigInt(couponId));
  }

  @Patch(':couponId')
  @ApiOperation({ summary: 'Update a coupon' })
  @ApiResponse({ status: 200, description: 'Coupon updated' })
  async update(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('couponId') couponId: string,
    @Body() dto: UpdateCouponDto,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.couponsService.update(BigInt(storeId), BigInt(couponId), dto);
  }

  @Delete(':couponId')
  @ApiOperation({ summary: 'Delete a coupon' })
  @ApiResponse({ status: 200, description: 'Coupon deleted' })
  async delete(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('couponId') couponId: string,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.couponsService.delete(BigInt(storeId), BigInt(couponId));
  }
}
