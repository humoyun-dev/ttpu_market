import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(storeId: bigint) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalCustomers,
      totalOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
      recentOrders,
      topProducts,
      ordersByStatus,
    ] = await Promise.all([
      // Total customers
      this.prisma.telegramCustomer.count({
        where: { storeId },
      }),

      // Total orders
      this.prisma.order.count({
        where: { storeId },
      }),

      // Total revenue
      this.prisma.order.aggregate({
        where: { storeId, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),

      // Today's orders
      this.prisma.order.count({
        where: {
          storeId,
          createdAt: { gte: today },
        },
      }),

      // Today's revenue
      this.prisma.order.aggregate({
        where: {
          storeId,
          createdAt: { gte: today },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),

      // Recent orders
      this.prisma.order.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          telegramCustomer: {
            select: { firstName: true, lastName: true },
          },
        },
      }),

      // Top products by order count (last 30 days)
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            storeId,
            createdAt: { gte: thirtyDaysAgo },
            status: { not: 'CANCELLED' },
          },
        },
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),

      // Orders by status
      this.prisma.order.groupBy({
        by: ['status'],
        where: { storeId },
        _count: { id: true },
      }),
    ]);

    // Get product names for top products
    const productIds = topProducts.map((p) => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const productMap = new Map(products.map((p) => [p.id.toString(), p.name]));

    return {
      overview: {
        totalCustomers,
        totalOrders,
        totalRevenue: totalRevenue._sum.total || BigInt(0),
        todayOrders,
        todayRevenue: todayRevenue._sum.total || BigInt(0),
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id.toString(),
        orderNo: order.orderNo,
        total: order.total,
        status: order.status,
        customer: `${order.telegramCustomer.firstName || ''} ${order.telegramCustomer.lastName || ''}`.trim(),
        createdAt: order.createdAt,
      })),
      topProducts: topProducts.map((p) => ({
        productId: p.productId.toString(),
        name: productMap.get(p.productId.toString()) || 'Unknown',
        totalQuantity: p._sum.quantity || 0,
        orderCount: p._count.id,
      })),
      ordersByStatus: ordersByStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  async getRevenueChart(storeId: bigint, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: {
        storeId,
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    // Group by date
    const revenueByDate = new Map<string, bigint>();

    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      const existing = revenueByDate.get(dateKey) || BigInt(0);
      revenueByDate.set(dateKey, existing + order.total);
    }

    // Generate all dates in range
    const result: Array<{ date: string; revenue: bigint }> = [];
    const currentDate = new Date(startDate);
    const today = new Date();

    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateKey,
        revenue: revenueByDate.get(dateKey) || BigInt(0),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  async getCustomerGrowth(storeId: bigint, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const customers = await this.prisma.telegramCustomer.findMany({
      where: {
        storeId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by date
    const customersByDate = new Map<string, number>();

    for (const customer of customers) {
      const dateKey = customer.createdAt.toISOString().split('T')[0];
      const existing = customersByDate.get(dateKey) || 0;
      customersByDate.set(dateKey, existing + 1);
    }

    // Generate all dates in range
    const result: Array<{ date: string; newCustomers: number }> = [];
    const currentDate = new Date(startDate);
    const today = new Date();

    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateKey,
        newCustomers: customersByDate.get(dateKey) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }
}
