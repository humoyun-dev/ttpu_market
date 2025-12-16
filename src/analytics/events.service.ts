import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async track(
    storeId: bigint,
    telegramUserId: bigint | null | undefined,
    eventName: string,
    properties?: Record<string, any>,
  ) {
    try {
      let telegramCustomerId: bigint | null = null;

      if (telegramUserId) {
        const customer = await this.prisma.telegramCustomer.findFirst({
          where: { storeId, telegramUserId: BigInt(telegramUserId) },
          select: { id: true },
        });
        telegramCustomerId = customer?.id || null;
      }

      await this.prisma.event.create({
        data: {
          storeId,
          telegramCustomerId,
          eventName,
          properties: properties || {},
        },
      });

      this.logger.debug(`Event tracked: ${eventName} for store ${storeId}`);
    } catch (error) {
      this.logger.error(`Failed to track event ${eventName}:`, error);
    }
  }

  async getEvents(
    storeId: bigint,
    options?: {
      page?: number;
      eventName?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ) {
    const where: any = { storeId };
    const page = options?.page || 1;
    const limit = options?.limit || 100;

    if (options?.eventName) {
      where.eventName = options.eventName;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options?.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options?.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          telegramCustomer: {
            select: { id: true, firstName: true, lastName: true, username: true },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: events,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEventCounts(storeId: bigint, startDate?: Date, endDate?: Date) {
    const where: any = { storeId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const events = await this.prisma.event.groupBy({
      by: ['eventName'],
      where,
      _count: { id: true },
    });

    return events.reduce(
      (acc, event) => {
        acc[event.eventName] = event._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
