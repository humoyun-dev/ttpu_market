import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: bigint, dto: CreateCouponDto) {
    // Check code uniqueness
    const existing = await this.prisma.coupon.findUnique({
      where: {
        storeId_code: { storeId, code: dto.code.toUpperCase() },
      },
    });

    if (existing) {
      throw new ConflictException('Coupon code already exists');
    }

    const { productIds, categoryIds, ...couponData } = dto;

    const coupon = await this.prisma.coupon.create({
      data: {
        storeId,
        code: dto.code.toUpperCase(),
        type: dto.type,
        value: BigInt(dto.value),
        minOrderAmount: dto.minOrderAmount ? BigInt(dto.minOrderAmount) : BigInt(0),
        maxDiscount: dto.maxDiscount ? BigInt(dto.maxDiscount) : null,
        usageLimit: dto.usageLimit,
        perUserLimit: dto.perUserLimit ?? 1,
        startsAt: dto.startsAt,
        expiresAt: dto.expiresAt,
        isActive: dto.isActive ?? true,
        products: productIds
          ? {
              create: productIds.map((productId) => ({
                productId: BigInt(productId),
              })),
            }
          : undefined,
        categories: categoryIds
          ? {
              create: categoryIds.map((categoryId) => ({
                categoryId: BigInt(categoryId),
              })),
            }
          : undefined,
      },
      include: {
        products: { include: { product: { select: { id: true, name: true } } } },
        categories: { include: { category: { select: { id: true, name: true } } } },
      },
    });

    return coupon;
  }

  async findAll(storeId: bigint) {
    return this.prisma.coupon.findMany({
      where: { storeId },
      include: {
        _count: { select: { redemptions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(storeId: bigint, couponId: bigint) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { id: couponId, storeId },
      include: {
        products: { include: { product: { select: { id: true, name: true } } } },
        categories: { include: { category: { select: { id: true, name: true } } } },
        _count: { select: { redemptions: true } },
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async update(storeId: bigint, couponId: bigint, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { id: couponId, storeId },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // Check code uniqueness if changing code
    if (dto.code && dto.code.toUpperCase() !== coupon.code) {
      const existing = await this.prisma.coupon.findUnique({
        where: {
          storeId_code: { storeId, code: dto.code.toUpperCase() },
        },
      });

      if (existing) {
        throw new ConflictException('Coupon code already exists');
      }
    }

    const { productIds, categoryIds, ...couponData } = dto;

    // Update product and category associations if provided
    if (productIds !== undefined) {
      await this.prisma.couponProduct.deleteMany({
        where: { couponId },
      });

      if (productIds.length > 0) {
        await this.prisma.couponProduct.createMany({
          data: productIds.map((productId) => ({
            couponId,
            productId: BigInt(productId),
          })),
        });
      }
    }

    if (categoryIds !== undefined) {
      await this.prisma.couponCategory.deleteMany({
        where: { couponId },
      });

      if (categoryIds.length > 0) {
        await this.prisma.couponCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            couponId,
            categoryId: BigInt(categoryId),
          })),
        });
      }
    }

    const updated = await this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        code: dto.code ? dto.code.toUpperCase() : undefined,
        type: dto.type,
        value: dto.value !== undefined ? BigInt(dto.value) : undefined,
        minOrderAmount: dto.minOrderAmount !== undefined ? BigInt(dto.minOrderAmount) : undefined,
        maxDiscount: dto.maxDiscount !== undefined ? BigInt(dto.maxDiscount) : undefined,
        usageLimit: dto.usageLimit,
        perUserLimit: dto.perUserLimit,
        startsAt: dto.startsAt,
        expiresAt: dto.expiresAt,
        isActive: dto.isActive,
      },
      include: {
        products: { include: { product: { select: { id: true, name: true } } } },
        categories: { include: { category: { select: { id: true, name: true } } } },
      },
    });

    return updated;
  }

  async delete(storeId: bigint, couponId: bigint) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { id: couponId, storeId },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.prisma.coupon.delete({
      where: { id: couponId },
    });

    return { deleted: true };
  }
}
