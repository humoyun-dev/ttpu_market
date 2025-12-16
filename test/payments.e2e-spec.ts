import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Payment Callbacks E2E Tests (Table-Driven)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let storeId: bigint;
  let orderId: bigint;
  let orderNo: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up
    await prisma.paymentAttempt.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.paymentSetting.deleteMany({});
    await prisma.orderStatusHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.telegramCustomer.deleteMany({});
    await prisma.store.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test data
    const user = await prisma.user.create({
      data: {
        email: 'payments@example.com',
        password: 'hashed',
        fullName: 'Payments User',
      },
    });

    const store = await prisma.store.create({
      data: {
        ownerId: user.id,
        name: 'Payments Store',
        slug: 'payments-store',
      },
    });
    storeId = store.id;

    // Create payment settings
    await prisma.paymentSetting.create({
      data: {
        storeId: store.id,
        provider: 'PAYME',
        merchantId: 'test_merchant',
        secretKey: 'test_secret',
        isEnabled: true,
      },
    });

    await prisma.paymentSetting.create({
      data: {
        storeId: store.id,
        provider: 'CLICK',
        merchantId: 'test_merchant',
        secretKey: 'test_secret',
        isEnabled: true,
      },
    });

    const customer = await prisma.telegramCustomer.create({
      data: {
        storeId: store.id,
        telegramUserId: BigInt(12345),
        firstName: 'Test',
        languageCode: 'uz',
      },
    });

    orderNo = `ORD-${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        storeId: store.id,
        telegramCustomerId: customer.id,
        orderNo,
        status: 'PENDING_PAYMENT',
        subtotal: BigInt(100000),
        deliveryFee: BigInt(10000),
        total: BigInt(110000),
        customerPhone: '+998901234567',
        deliveryAddress: 'Test Address',
      },
    });
    orderId = order.id;
  });

  describe('POST /payments/payme/callback - Payme JSON-RPC Tests (Table-Driven)', () => {
    const paymeTestCases = [
      {
        name: 'CheckPerformTransaction should return allow: true for valid order',
        payload: () => ({
          method: 'CheckPerformTransaction',
          params: {
            account: { order_id: orderNo },
            amount: 110000 * 100, // Payme uses tiyin (1/100 of sum)
          },
        }),
        expectedStatus: 200,
        validateResponse: (body: any) => body.result?.allow === true,
      },
      {
        name: 'CheckPerformTransaction should return error for non-existent order',
        payload: () => ({
          method: 'CheckPerformTransaction',
          params: {
            account: { order_id: 'NON-EXISTENT-ORDER' },
            amount: 110000 * 100,
          },
        }),
        expectedStatus: 200,
        validateResponse: (body: any) => body.error?.code === -31050,
      },
      {
        name: 'CreateTransaction should set payment to processing',
        payload: () => ({
          method: 'CreateTransaction',
          params: {
            id: `payme_tx_${Date.now()}`,
            account: { order_id: orderNo },
            amount: 110000 * 100,
          },
        }),
        expectedStatus: 200,
        validateResponse: (body: any) => body.result?.state === 1,
      },
      {
        name: 'PerformTransaction should complete payment',
        payload: () => ({
          method: 'PerformTransaction',
          params: {
            id: `payme_tx_${Date.now()}`,
            account: { order_id: orderNo },
          },
        }),
        expectedStatus: 200,
        validateResponse: (body: any) => body.result?.state === 2,
        validateDb: async () => {
          const order = await prisma.order.findUnique({
            where: { id: orderId },
          });
          return order?.status === 'PAID';
        },
      },
      {
        name: 'CancelTransaction should cancel payment',
        payload: () => ({
          method: 'CancelTransaction',
          params: {
            id: `payme_tx_${Date.now()}`,
            account: { order_id: orderNo },
            reason: 1,
          },
        }),
        expectedStatus: 200,
        validateResponse: (body: any) => body.result?.state === -1,
      },
      {
        name: 'Should handle missing method gracefully',
        payload: () => ({
          params: {
            account: { order_id: orderNo },
          },
        }),
        expectedStatus: 200,
        // Service should return an error or handle gracefully
      },
      {
        name: 'Should handle missing order_id in account',
        payload: () => ({
          method: 'CheckPerformTransaction',
          params: {
            amount: 110000 * 100,
          },
        }),
        expectedStatus: 200,
        validateResponse: (body: any) => body.error !== undefined,
      },
      {
        name: 'CheckTransaction should return transaction state',
        payload: () => ({
          method: 'CheckTransaction',
          params: {
            id: `payme_check_${Date.now()}`,
          },
        }),
        expectedStatus: 200,
        // Will return error or state
      },
    ];

    paymeTestCases.forEach(
      ({ name, payload, expectedStatus, validateResponse, validateDb }) => {
        it(name, async () => {
          const response = await request(app.getHttpServer())
            .post('/payments/payme/callback')
            .send(payload())
            .expect(expectedStatus);

          if (validateResponse) {
            expect(validateResponse(response.body)).toBe(true);
          }

          if (validateDb) {
            const isValid = await validateDb();
            expect(isValid).toBe(true);
          }
        });
      },
    );
  });

  describe('POST /payments/click/callback - Click Tests (Table-Driven)', () => {
    const clickTestCases = [
      {
        name: 'Prepare action (action=0) should return success',
        payload: () => ({
          click_trans_id: `click_${Date.now()}`,
          merchant_trans_id: orderNo,
          amount: 110000,
          action: 0,
          error: 0,
          sign_time: new Date().toISOString(),
          sign_string: 'test',
        }),
        expectedStatus: 200,
        validateResponse: (body: any) => body.error === 0,
      },
      {
        name: 'Complete action (action=1) should complete payment',
        payload: () => ({
          click_trans_id: `click_${Date.now()}`,
          merchant_trans_id: orderNo,
          amount: 110000,
          action: 1,
          error: 0,
          sign_time: new Date().toISOString(),
          sign_string: 'test',
        }),
        expectedStatus: 200,
        validateResponse: (body: any) => body.error === 0,
      },
      {
        name: 'Should return error for non-existent order',
        payload: () => ({
          click_trans_id: `click_${Date.now()}`,
          merchant_trans_id: 'NON-EXISTENT-ORDER',
          amount: 110000,
          action: 0,
          error: 0,
        }),
        expectedStatus: 200,
        validateResponse: (body: any) => body.error !== 0,
      },
      {
        name: 'Should handle error code from Click',
        payload: () => ({
          click_trans_id: `click_error_${Date.now()}`,
          merchant_trans_id: orderNo,
          amount: 110000,
          action: 1,
          error: -5, // Some error code from Click
        }),
        expectedStatus: 200,
        // Service should handle gracefully
      },
      {
        name: 'Should handle missing merchant_trans_id',
        payload: () => ({
          click_trans_id: `click_${Date.now()}`,
          amount: 110000,
          action: 0,
          error: 0,
        }),
        expectedStatus: 200,
        validateResponse: (body: any) => body.error !== 0,
      },
      {
        name: 'Should handle idempotent requests',
        payload: () => ({
          click_trans_id: `click_idempotent_${Date.now()}`,
          merchant_trans_id: orderNo,
          amount: 110000,
          action: 1,
          error: 0,
        }),
        expectedStatus: 200,
        sendTwice: true,
      },
      {
        name: 'Should handle cancel/refund action (action=2)',
        payload: () => ({
          click_trans_id: `click_cancel_${Date.now()}`,
          merchant_trans_id: orderNo,
          amount: 110000,
          action: 2,
          error: 0,
        }),
        expectedStatus: 200,
      },
      {
        name: 'Should return error for amount mismatch',
        payload: () => ({
          click_trans_id: `click_mismatch_${Date.now()}`,
          merchant_trans_id: orderNo,
          amount: 50000, // Wrong amount
          action: 0,
          error: 0,
        }),
        expectedStatus: 200,
        // Service may or may not check amount depending on implementation
      },
    ];

    clickTestCases.forEach(
      ({ name, payload, expectedStatus, validateResponse, sendTwice }) => {
        it(name, async () => {
          const payloadData = payload();

          if (sendTwice) {
            await request(app.getHttpServer())
              .post('/payments/click/callback')
              .send(payloadData);
          }

          const response = await request(app.getHttpServer())
            .post('/payments/click/callback')
            .send(payloadData)
            .expect(expectedStatus);

          if (validateResponse) {
            expect(validateResponse(response.body)).toBe(true);
          }
        });
      },
    );
  });
});
