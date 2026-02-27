import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { ProductsService } from './products.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
  DeleteResponseDto,
  CategoryDto,
  CategoryDetailDto,
  CategoryListItemDto,
  ProductDetailDto,
  ProductDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { StoresService } from '../stores/stores.service';

@ApiTags('Catalog')
@Controller('stores/:storeId')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CatalogController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
    private readonly storesService: StoresService,
  ) {}

  // Categories
  @Post('categories')
  @ApiOperation({ summary: 'Create a category' })
  @ApiCreatedResponse({ status: 201, description: 'Category created', type: CategoryDto })
  async createCategory(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.categoriesService.create(BigInt(storeId), dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiOkResponse({ status: 200, description: 'List of categories', type: [CategoryListItemDto] })
  async getCategories(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.categoriesService.findAll(BigInt(storeId));
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiOkResponse({ status: 200, description: 'Category details', type: CategoryDetailDto })
  async getCategory(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('id') id: string,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.categoriesService.findOne(BigInt(storeId), BigInt(id));
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiOkResponse({ status: 200, description: 'Category updated', type: CategoryDto })
  async updateCategory(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.categoriesService.update(BigInt(storeId), BigInt(id), dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiOkResponse({ status: 200, description: 'Category deleted', type: DeleteResponseDto })
  async deleteCategory(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('id') id: string,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.categoriesService.delete(BigInt(storeId), BigInt(id));
  }

  // Products
  @Post('products')
  @ApiOperation({ summary: 'Create a product' })
  @ApiCreatedResponse({ status: 201, description: 'Product created', type: ProductDto })
  async createProduct(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Body() dto: CreateProductDto,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.productsService.create(BigInt(storeId), dto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiOkResponse({ status: 200, description: 'List of products', type: [ProductDto] })
  async getProducts(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.productsService.findAll(BigInt(storeId), { categoryId, isActive });
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiOkResponse({ status: 200, description: 'Product details', type: ProductDetailDto })
  async getProduct(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('id') id: string,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.productsService.findOne(BigInt(storeId), BigInt(id));
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiOkResponse({ status: 200, description: 'Product updated', type: ProductDto })
  async updateProduct(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.productsService.update(BigInt(storeId), BigInt(id), dto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiOkResponse({ status: 200, description: 'Product deleted', type: DeleteResponseDto })
  async deleteProduct(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('id') id: string,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.productsService.delete(BigInt(storeId), BigInt(id));
  }
}
