import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: bigint, dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        storeId,
        name: dto.name,
        description: dto.description,
        price: BigInt(dto.price),
        stockQty: dto.stockQty ?? 0,
        categoryId: dto.categoryId ? BigInt(dto.categoryId) : null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        images: dto.imageUrls
          ? {
              create: dto.imageUrls.map((url, index) => ({
                url,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        category: { select: { id: true, name: true } },
      },
    });

    return product;
  }

  async findAll(storeId: bigint, options?: { categoryId?: string; isActive?: boolean }) {
    const products = await this.prisma.product.findMany({
      where: {
        storeId,
        categoryId: options?.categoryId ? BigInt(options.categoryId) : undefined,
        isActive: options?.isActive,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return products;
  }

  async findOne(storeId: bigint, productId: bigint) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true } },
        translations: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(storeId: bigint, productId: bigint, dto: UpdateProductDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Handle image updates
    if (dto.imageUrls) {
      // Delete existing images
      await this.prisma.productImage.deleteMany({
        where: { productId },
      });

      // Create new images
      await this.prisma.productImage.createMany({
        data: dto.imageUrls.map((url, index) => ({
          productId,
          url,
          sortOrder: index,
        })),
      });
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price !== undefined ? BigInt(dto.price) : undefined,
        stockQty: dto.stockQty,
        categoryId: dto.categoryId !== undefined ? (dto.categoryId ? BigInt(dto.categoryId) : null) : undefined,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  async delete(storeId: bigint, productId: bigint) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({
      where: { id: productId },
    });

    return { deleted: true };
  }
}
