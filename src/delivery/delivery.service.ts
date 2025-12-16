import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateStoreLocationDto,
  UpdateStoreLocationDto,
  CreateDeliveryZoneDto,
  UpdateDeliveryZoneDto,
} from './dto';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  // Store Locations
  async createLocation(storeId: bigint, dto: CreateStoreLocationDto) {
    return this.prisma.storeLocation.create({
      data: {
        storeId,
        ...dto,
      },
    });
  }

  async getLocations(storeId: bigint) {
    return this.prisma.storeLocation.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLocation(storeId: bigint, locationId: bigint) {
    const location = await this.prisma.storeLocation.findFirst({
      where: { id: locationId, storeId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return location;
  }

  async updateLocation(storeId: bigint, locationId: bigint, dto: UpdateStoreLocationDto) {
    const location = await this.prisma.storeLocation.findFirst({
      where: { id: locationId, storeId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return this.prisma.storeLocation.update({
      where: { id: locationId },
      data: dto,
    });
  }

  async deleteLocation(storeId: bigint, locationId: bigint) {
    const location = await this.prisma.storeLocation.findFirst({
      where: { id: locationId, storeId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    await this.prisma.storeLocation.delete({
      where: { id: locationId },
    });

    return { deleted: true };
  }

  // Delivery Zones
  async createZone(storeId: bigint, dto: CreateDeliveryZoneDto) {
    const { tiers, ...zoneData } = dto;

    const zone = await this.prisma.deliveryZone.create({
      data: {
        storeId,
        ...zoneData,
        tiers: tiers
          ? {
              create: tiers.map((tier) => ({
                minOrderAmount: BigInt(tier.minOrderAmount),
                deliveryFee: BigInt(tier.deliveryFee),
              })),
            }
          : undefined,
      },
      include: { tiers: true },
    });

    return zone;
  }

  async getZones(storeId: bigint) {
    return this.prisma.deliveryZone.findMany({
      where: { storeId },
      include: { tiers: { orderBy: { minOrderAmount: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getZone(storeId: bigint, zoneId: bigint) {
    const zone = await this.prisma.deliveryZone.findFirst({
      where: { id: zoneId, storeId },
      include: { tiers: { orderBy: { minOrderAmount: 'asc' } } },
    });

    if (!zone) {
      throw new NotFoundException('Delivery zone not found');
    }

    return zone;
  }

  async updateZone(storeId: bigint, zoneId: bigint, dto: UpdateDeliveryZoneDto) {
    const zone = await this.prisma.deliveryZone.findFirst({
      where: { id: zoneId, storeId },
    });

    if (!zone) {
      throw new NotFoundException('Delivery zone not found');
    }

    const { tiers, ...zoneData } = dto;

    // Update zone
    const updatedZone = await this.prisma.deliveryZone.update({
      where: { id: zoneId },
      data: zoneData,
    });

    // Update tiers if provided
    if (tiers) {
      // Delete existing tiers
      await this.prisma.deliveryZoneTier.deleteMany({
        where: { deliveryZoneId: zoneId },
      });

      // Create new tiers
      await this.prisma.deliveryZoneTier.createMany({
        data: tiers.map((tier) => ({
          deliveryZoneId: zoneId,
          minOrderAmount: BigInt(tier.minOrderAmount),
          deliveryFee: BigInt(tier.deliveryFee),
        })),
      });
    }

    return this.getZone(storeId, zoneId);
  }

  async deleteZone(storeId: bigint, zoneId: bigint) {
    const zone = await this.prisma.deliveryZone.findFirst({
      where: { id: zoneId, storeId },
    });

    if (!zone) {
      throw new NotFoundException('Delivery zone not found');
    }

    await this.prisma.deliveryZone.delete({
      where: { id: zoneId },
    });

    return { deleted: true };
  }
}
