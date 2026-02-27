import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider, PaymentStatus, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdatePaymentSettingsDto } from './dto';

function redactPaymePayload(payload: any): Prisma.InputJsonValue {
  const params = payload?.params ?? {};
  const account = params?.account ?? {};

  const safe = {
    ...(typeof payload?.method === 'string' ? { method: payload.method } : {}),
    ...(typeof payload?.id === 'string' || typeof payload?.id === 'number' ? { id: payload.id } : {}),
    params: {
      ...(typeof params?.id === 'string' || typeof params?.id === 'number' ? { id: params.id } : {}),
      ...(typeof params?.time === 'number' ? { time: params.time } : {}),
      ...(typeof params?.amount === 'number' || typeof params?.amount === 'string'
        ? { amount: params.amount }
        : {}),
      account: {
        ...(typeof account?.order_id === 'string' || typeof account?.order_id === 'number'
          ? { order_id: account.order_id }
          : {}),
      },
    },
  };

  return safe as Prisma.InputJsonValue;
}

function redactClickPayload(payload: any): Prisma.InputJsonValue {
  const safe = {
    ...(payload?.click_trans_id !== undefined ? { click_trans_id: String(payload.click_trans_id) } : {}),
    ...(payload?.merchant_trans_id !== undefined
      ? { merchant_trans_id: String(payload.merchant_trans_id) }
      : {}),
    ...(typeof payload?.amount === 'string' || typeof payload?.amount === 'number'
      ? { amount: payload.amount }
      : {}),
    ...(typeof payload?.action === 'string' || typeof payload?.action === 'number'
      ? { action: payload.action }
      : {}),
    ...(typeof payload?.error === 'string' || typeof payload?.error === 'number'
      ? { error: payload.error }
      : {}),
    ...(typeof payload?.error_note === 'string' ? { error_note: payload.error_note } : {}),
    ...(typeof payload?.sign_time === 'string' ? { sign_time: payload.sign_time } : {}),
  };

  return safe as Prisma.InputJsonValue;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getSettings(storeId: bigint, provider: PaymentProvider) {
    let settings = await this.prisma.paymentSetting.findUnique({
      where: {
        storeId_provider: { storeId, provider },
      },
    });

    if (!settings) {
      // Create default settings
      settings = await this.prisma.paymentSetting.create({
        data: {
          storeId,
          provider,
          isEnabled: provider === PaymentProvider.CASH,
        },
      });
    }

    // Don't return secretKey
    const { secretKey, ...safeSettings } = settings;
    return safeSettings;
  }

  async updateSettings(storeId: bigint, provider: PaymentProvider, dto: UpdatePaymentSettingsDto) {
    const settings = await this.prisma.paymentSetting.upsert({
      where: {
        storeId_provider: { storeId, provider },
      },
      create: {
        storeId,
        provider,
        ...dto,
      },
      update: dto,
    });

    const { secretKey, ...safeSettings } = settings;
    return safeSettings;
  }

  async handlePaymeCallback(payload: any) {
    const strictMode = this.configService.get('PAYMENT_SIGNATURE_STRICT') === 'true';

    // Parse Payme payload
    const method = payload.method;
    const params = payload.params || {};

    // Store payment attempt
    const orderId = params.account?.order_id || params.id;
    const providerTransactionId = params.id || `payme_${Date.now()}`;

    if (!orderId) {
      return { error: { code: -31050, message: 'Order not found' } };
    }

    // Find order
    const order = await this.prisma.order.findFirst({
      where: { orderNo: String(orderId) },
      include: { payments: true },
    });

    if (!order) {
      return { error: { code: -31050, message: 'Order not found' } };
    }

    // Get or create payment
    let payment = await this.prisma.payment.findFirst({
      where: {
        orderId: order.id,
        provider: PaymentProvider.PAYME,
      },
    });

    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          provider: PaymentProvider.PAYME,
          amount: order.total,
          providerTransactionId,
          rawPayload: redactPaymePayload(payload),
        },
      });
    }

    // Log attempt
    await this.prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        rawPayload: redactPaymePayload(payload),
      },
    });

    // Handle methods
    switch (method) {
      case 'CheckPerformTransaction':
        return {
          result: {
            allow: true,
            additional: { order_id: order.id.toString() },
          },
        };

      case 'CreateTransaction':
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PROCESSING,
            providerTransactionId,
          },
        });
        return {
          result: {
            create_time: Date.now(),
            transaction: providerTransactionId,
            state: 1,
          },
        };

      case 'PerformTransaction':
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.PAID },
        });

        // Update order status
        const currentOrder = await this.prisma.order.findUnique({
          where: { id: order.id },
        });

        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID },
        });

        await this.prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: currentOrder?.status,
            toStatus: OrderStatus.PAID,
            comment: 'Payment confirmed via Payme',
          },
        });

        return {
          result: {
            perform_time: Date.now(),
            transaction: providerTransactionId,
            state: 2,
          },
        };

      case 'CancelTransaction':
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.CANCELLED },
        });

        return {
          result: {
            cancel_time: Date.now(),
            transaction: providerTransactionId,
            state: -1,
          },
        };

      default:
        return { error: { code: -32601, message: 'Method not found' } };
    }
  }

  async handleClickCallback(payload: any) {
    const strictMode = this.configService.get('PAYMENT_SIGNATURE_STRICT') === 'true';

    // Parse Click payload
    const {
      click_trans_id,
      merchant_trans_id,
      amount,
      action,
      error,
      error_note,
      sign_time,
      sign_string,
    } = payload;

    // Find order
    const order = await this.prisma.order.findFirst({
      where: { orderNo: String(merchant_trans_id) },
    });

    if (!order) {
      return {
        error: -5,
        error_note: 'Order not found',
      };
    }

    // Get or create payment
    let payment = await this.prisma.payment.findFirst({
      where: {
        orderId: order.id,
        provider: PaymentProvider.CLICK,
      },
    });

    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          provider: PaymentProvider.CLICK,
          amount: order.total,
          providerTransactionId: String(click_trans_id),
          rawPayload: redactClickPayload(payload),
        },
      });
    }

    // Log attempt
    await this.prisma.paymentAttempt.create({
      data: {
        paymentId: payment.id,
        rawPayload: redactClickPayload(payload),
      },
    });

    // Handle action
    if (action === 0) {
      // Prepare
      return {
        click_trans_id,
        merchant_trans_id,
        merchant_prepare_id: payment.id.toString(),
        error: 0,
        error_note: 'Success',
      };
    } else if (action === 1) {
      // Complete
      if (error === 0) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.PAID },
        });

        // Update order status
        const currentOrder = await this.prisma.order.findUnique({
          where: { id: order.id },
        });

        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID },
        });

        await this.prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: currentOrder?.status,
            toStatus: OrderStatus.PAID,
            comment: 'Payment confirmed via Click',
          },
        });
      } else {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
        });
      }

      return {
        click_trans_id,
        merchant_trans_id,
        merchant_confirm_id: payment.id.toString(),
        error: 0,
        error_note: 'Success',
      };
    }

    return {
      error: -8,
      error_note: 'Unknown action',
    };
  }
}
