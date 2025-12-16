import { Controller, Get, Post, Patch, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto, UpdateStoreDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

function parseBigIntId(id: string): bigint {
  if (!/^\d+$/.test(id)) {
    throw new BadRequestException('Invalid ID format');
  }
  return BigInt(id);
}

@ApiTags('Stores')
@Controller('stores')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({ status: 201, description: 'Store created successfully' })
  @ApiResponse({ status: 409, description: 'Store slug already exists' })
  async create(@CurrentUser() user: any, @Body() dto: CreateStoreDto) {
    return this.storesService.create(BigInt(user.id), dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stores owned by user' })
  @ApiResponse({ status: 200, description: 'List of stores' })
  async findAll(@CurrentUser() user: any) {
    return this.storesService.findAllByUser(BigInt(user.id));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a store by ID' })
  @ApiResponse({ status: 200, description: 'Store details' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not owner' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.storesService.findOne(parseBigIntId(id), BigInt(user.id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a store' })
  @ApiResponse({ status: 200, description: 'Store updated successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not owner' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.update(parseBigIntId(id), BigInt(user.id), dto);
  }
}
