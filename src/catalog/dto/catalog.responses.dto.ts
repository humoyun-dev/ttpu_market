import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteResponseDto {
  @ApiProperty({ example: true })
  deleted: boolean;
}

export class CategoryParentDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'Electronics' })
  name: string;
}

export class CategoryChildDto {
  @ApiProperty({ example: '2' })
  id: string;

  @ApiProperty({ example: 'Phones' })
  name: string;

  @ApiProperty({ example: 'phones' })
  slug: string;
}

export class CategoryCountDto {
  @ApiProperty({ example: 12 })
  products: number;

  @ApiProperty({ example: 3 })
  children: number;
}

export class CategoryDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '10' })
  storeId: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: '0' })
  parentId?: string | null;

  @ApiProperty({ example: 'Electronics' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Электроника' })
  nameRu?: string | null;

  @ApiProperty({ example: 'electronics' })
  slug: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'https://example.com/cat.png' })
  imageUrl?: string | null;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

export class CategoryListItemDto extends CategoryDto {
  @ApiPropertyOptional({ type: CategoryParentDto, nullable: true })
  parent?: CategoryParentDto | null;

  @ApiProperty({ type: CategoryCountDto })
  _count: CategoryCountDto;
}

export class CategoryDetailDto extends CategoryListItemDto {
  @ApiProperty({ type: [CategoryChildDto] })
  children: CategoryChildDto[];
}

export class ProductImageDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '100' })
  productId: string;

  @ApiProperty({ example: 'https://example.com/img1.jpg' })
  url: string;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

export class ProductCategorySummaryDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'Electronics' })
  name: string;
}

export class ProductTranslationDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'uz' })
  language: string;

  @ApiProperty({ example: 'Smartphone' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'A great smartphone' })
  description?: string | null;
}

export class ProductDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '10' })
  storeId: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2' })
  categoryId?: string | null;

  @ApiProperty({ example: 'Smartphone' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'A great smartphone' })
  description?: string | null;

  @ApiProperty({ example: '1000000' })
  price: string;

  @ApiProperty({ example: 100 })
  stockQty: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ type: [ProductImageDto] })
  images: ProductImageDto[];

  @ApiPropertyOptional({ type: ProductCategorySummaryDto, nullable: true })
  category?: ProductCategorySummaryDto | null;
}

export class ProductDetailDto extends ProductDto {
  @ApiProperty({ type: [ProductTranslationDto] })
  translations: ProductTranslationDto[];
}

