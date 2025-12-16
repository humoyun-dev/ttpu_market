import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateOrderStatusDto } from './dto';
import { OrderStatus } from '@prisma/client';

// Order status transition map
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['READY', 'SHIPPED', 'CANCELLED', 'REFUNDED'],
  READY: ['SHIPPED', 'DELIVERED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
  // Legacy statuses mapped
  PENDING: ['PENDING_PAYMENT', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const allowedStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedStatuses.includes(newStatus)) {
      throw new ConflictException('Illegal status transition');
    }
  }

  async findAll(storeId: bigint, options?: { status?: string; page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { storeId };
    if (options?.status) {
      where.status = options.status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
          telegramCustomer: {
            select: {
              id: true,
              telegramUserId: true,
              firstName: true,
              lastName: true,
              phone: true,
              username: true,
            },
          },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(storeId: bigint, orderId: bigint) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
        telegramCustomer: {
          select: {
            id: true,
            telegramUserId: true,
            firstName: true,
            lastName: true,
            phone: true,
            username: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        payments: true,
        coupon: { select: { id: true, code: true, type: true, value: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(storeId: bigint, orderId: bigint, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transition
    this.validateStatusTransition(order.status, dto.status as OrderStatus);

    // Update order status and create history entry
    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: dto.status },
        include: {
          items: true,
          telegramCustomer: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: dto.status,
          comment: dto.comment,
        },
      }),
    ]);

    return updatedOrder;
  }

  async getStats(storeId: bigint) {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.order.count({ where: { storeId } }),
      this.prisma.order.count({ where: { storeId, status: 'PENDING' } }),
      this.prisma.order.count({ where: { storeId, status: 'CONFIRMED' } }),
      this.prisma.order.count({ where: { storeId, status: 'DELIVERED' } }),
      this.prisma.order.count({ where: { storeId, status: 'CANCELLED' } }),
      this.prisma.order.aggregate({
        where: { storeId, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.total || BigInt(0),
    };
  }
}
