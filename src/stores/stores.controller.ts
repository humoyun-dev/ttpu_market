import { Controller, Get, Post, Patch, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto, StoreDetailDto, StoreDto, StoreListItemDto, UpdateStoreDto } from './dto';
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
  @ApiCreatedResponse({ description: 'Store created successfully', type: StoreDto })
  @ApiConflictResponse({ description: 'Store slug already exists' })
  async create(@CurrentUser() user: any, @Body() dto: CreateStoreDto) {
    return this.storesService.create(BigInt(user.id), dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stores owned by user' })
  @ApiOkResponse({ description: 'List of stores', type: [StoreListItemDto] })
  async findAll(@CurrentUser() user: any) {
    return this.storesService.findAllByUser(BigInt(user.id));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a store by ID' })
  @ApiOkResponse({ description: 'Store details', type: StoreDetailDto })
  @ApiNotFoundResponse({ description: 'Store not found' })
  @ApiForbiddenResponse({ description: 'Forbidden - not owner' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.storesService.findOne(parseBigIntId(id), BigInt(user.id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a store' })
  @ApiOkResponse({ description: 'Store updated successfully', type: StoreDto })
  @ApiNotFoundResponse({ description: 'Store not found' })
  @ApiForbiddenResponse({ description: 'Forbidden - not owner' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.update(parseBigIntId(id), BigInt(user.id), dto);
  }
}
