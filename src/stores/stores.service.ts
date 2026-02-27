import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateStoreDto, UpdateStoreDto } from './dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: bigint, dto: CreateStoreDto) {
    const existingStore = await this.prisma.store.findUnique({
      where: { slug: dto.slug },
    });

    if (existingStore) {
      throw new ConflictException('Store slug already exists');
    }

    const store = await this.prisma.store.create({
      data: {
        ownerId: userId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        logoUrl: dto.logoUrl,
        supportedLanguages: dto.supportedLanguages || ['uz', 'ru'],
        defaultLanguage: dto.defaultLanguage || 'uz',
        currency: dto.currency || 'UZS',
        timezone: dto.timezone || 'Asia/Tashkent',
      },
    });

    return store;
  }

  async findAllByUser(userId: bigint) {
    const stores = await this.prisma.store.findMany({
      where: { ownerId: userId },
      include: {
        telegramBot: {
          select: {
            id: true,
            botId: true,
            username: true,
            isActive: true,
            webhookUrl: true,
          },
        },
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return stores;
  }

  async findOne(storeId: bigint, userId: bigint) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        telegramBot: {
          select: {
            id: true,
            botId: true,
            username: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            products: true,
            categories: true,
            orders: true,
            telegramCustomers: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.ownerId !== userId) {
      throw new ForbiddenException('You do not own this store');
    }

    return store;
  }

  async update(storeId: bigint, userId: bigint, dto: UpdateStoreDto) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.ownerId !== userId) {
      throw new ForbiddenException('You do not own this store');
    }

    if (dto.slug && dto.slug !== store.slug) {
      const existingStore = await this.prisma.store.findUnique({
        where: { slug: dto.slug },
      });

      if (existingStore) {
        throw new ConflictException('Store slug already exists');
      }
    }

    const updatedStore = await this.prisma.store.update({
      where: { id: storeId },
      data: dto,
    });

    return updatedStore;
  }

  async verifyOwnership(storeId: bigint, userId: bigint): Promise<void> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { ownerId: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.ownerId !== userId) {
      throw new ForbiddenException('You do not own this store');
    }
  }
}
