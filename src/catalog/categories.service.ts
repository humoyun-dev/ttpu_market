import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: bigint, dto: CreateCategoryDto) {
    // Check slug uniqueness within store
    const existing = await this.prisma.category.findUnique({
      where: {
        storeId_slug: { storeId, slug: dto.slug },
      },
    });

    if (existing) {
      throw new ConflictException('Category slug already exists in this store');
    }

    const category = await this.prisma.category.create({
      data: {
        storeId,
        name: dto.name,
        nameRu: dto.nameRu,
        slug: dto.slug,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId ? BigInt(dto.parentId) : null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    return category;
  }

  async findAll(storeId: bigint) {
    const categories = await this.prisma.category.findMany({
      where: { storeId },
      include: {
        _count: { select: { products: true, children: true } },
        parent: { select: { id: true, name: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories;
  }

  async findOne(storeId: bigint, categoryId: bigint) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, storeId },
      include: {
        _count: { select: { products: true, children: true } },
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(storeId: bigint, categoryId: bigint, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, storeId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check slug uniqueness if changing slug
    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.prisma.category.findUnique({
        where: {
          storeId_slug: { storeId, slug: dto.slug },
        },
      });

      if (existing) {
        throw new ConflictException('Category slug already exists in this store');
      }
    }

    const updated = await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        name: dto.name,
        nameRu: dto.nameRu,
        slug: dto.slug,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId !== undefined ? (dto.parentId ? BigInt(dto.parentId) : null) : undefined,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });

    return updated;
  }

  async delete(storeId: bigint, categoryId: bigint) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, storeId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.category.delete({
      where: { id: categoryId },
    });

    return { deleted: true };
  }
}
