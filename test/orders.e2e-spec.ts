import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

describe('Order Status Transitions E2E Tests (Table-Driven)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let storeId: string;

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
    await prisma.orderStatusHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.telegramCustomer.deleteMany({});
    await prisma.store.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user and store
    const res1 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'orders@example.com',
        password: 'Password123',
        fullName: 'Orders User',
      });
    userToken = res1.body.accessToken;

    const res2 = await request(app.getHttpServer())
      .post('/stores')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Orders Store',
        slug: 'orders-store',
      });
    storeId = res2.body.id;
  });

  const createOrder = async (initialStatus: OrderStatus): Promise<string> => {
    const customer = await prisma.telegramCustomer.create({
      data: {
        storeId: BigInt(storeId),
        telegramUserId: BigInt(Math.floor(Math.random() * 1000000)),
        firstName: 'Test',
        languageCode: 'uz',
      },
    });

    const order = await prisma.order.create({
      data: {
        storeId: BigInt(storeId),
        telegramCustomerId: customer.id,
        orderNo: `ORD-${Date.now()}`,
        status: initialStatus,
        subtotal: BigInt(100000),
        deliveryFee: BigInt(10000),
        total: BigInt(110000),
        customerPhone: '+998901234567',
        deliveryAddress: 'Test Address',
      },
    });

    return order.id.toString();
  };

  describe('PATCH /stores/:storeId/orders/:orderId/status - Transition Tests', () => {
    const transitionTestCases = [
      // Valid transitions
      {
        name: 'should allow DRAFT -> PENDING_PAYMENT',
        initialStatus: 'DRAFT' as OrderStatus,
        newStatus: 'PENDING_PAYMENT',
        expectedStatus: 200,
        isValid: true,
      },
      {
        name: 'should allow PENDING_PAYMENT -> PAID',
        initialStatus: 'PENDING_PAYMENT' as OrderStatus,
        newStatus: 'PAID',
        expectedStatus: 200,
        isValid: true,
      },
      {
        name: 'should allow PAID -> PROCESSING',
        initialStatus: 'PAID' as OrderStatus,
        newStatus: 'PROCESSING',
        expectedStatus: 200,
        isValid: true,
      },
      {
        name: 'should allow PROCESSING -> READY',
        initialStatus: 'PROCESSING' as OrderStatus,
        newStatus: 'READY',
        expectedStatus: 200,
        isValid: true,
      },
      {
        name: 'should allow READY -> SHIPPED',
        initialStatus: 'READY' as OrderStatus,
        newStatus: 'SHIPPED',
        expectedStatus: 200,
        isValid: true,
      },
      {
        name: 'should allow SHIPPED -> DELIVERED',
        initialStatus: 'SHIPPED' as OrderStatus,
        newStatus: 'DELIVERED',
        expectedStatus: 200,
        isValid: true,
      },
      {
        name: 'should allow DELIVERED -> REFUNDED',
        initialStatus: 'DELIVERED' as OrderStatus,
        newStatus: 'REFUNDED',
        expectedStatus: 200,
        isValid: true,
      },
      {
        name: 'should allow DRAFT -> CANCELLED',
        initialStatus: 'DRAFT' as OrderStatus,
        newStatus: 'CANCELLED',
        expectedStatus: 200,
        isValid: true,
      },
      // Invalid transitions
      {
        name: 'should reject CANCELLED -> PENDING_PAYMENT (409)',
        initialStatus: 'CANCELLED' as OrderStatus,
        newStatus: 'PENDING_PAYMENT',
        expectedStatus: 409,
        expectedError: 'Illegal status transition',
        isValid: false,
      },
      {
        name: 'should reject REFUNDED -> PAID (409)',
        initialStatus: 'REFUNDED' as OrderStatus,
        newStatus: 'PAID',
        expectedStatus: 409,
        expectedError: 'Illegal status transition',
        isValid: false,
      },
      {
        name: 'should reject DRAFT -> DELIVERED (409)',
        initialStatus: 'DRAFT' as OrderStatus,
        newStatus: 'DELIVERED',
        expectedStatus: 409,
        expectedError: 'Illegal status transition',
        isValid: false,
      },
      {
        name: 'should reject PENDING_PAYMENT -> PROCESSING (409)',
        initialStatus: 'PENDING_PAYMENT' as OrderStatus,
        newStatus: 'PROCESSING',
        expectedStatus: 409,
        expectedError: 'Illegal status transition',
        isValid: false,
      },
      {
        name: 'should reject SHIPPED -> PROCESSING (409)',
        initialStatus: 'SHIPPED' as OrderStatus,
        newStatus: 'PROCESSING',
        expectedStatus: 409,
        expectedError: 'Illegal status transition',
        isValid: false,
      },
      {
        name: 'should reject DELIVERED -> SHIPPED (409)',
        initialStatus: 'DELIVERED' as OrderStatus,
        newStatus: 'SHIPPED',
        expectedStatus: 409,
        expectedError: 'Illegal status transition',
        isValid: false,
      },
      {
        name: 'should reject invalid status value (400)',
        initialStatus: 'DRAFT' as OrderStatus,
        newStatus: 'INVALID_STATUS',
        expectedStatus: 400,
        isValid: false,
      },
      {
        name: 'should create status history on valid transition',
        initialStatus: 'DRAFT' as OrderStatus,
        newStatus: 'PENDING_PAYMENT',
        expectedStatus: 200,
        isValid: true,
        checkHistory: true,
      },
    ];

    transitionTestCases.forEach(
      ({
        name,
        initialStatus,
        newStatus,
        expectedStatus,
        expectedError,
        isValid,
        checkHistory,
      }) => {
        it(name, async () => {
          const orderId = await createOrder(initialStatus);

          const response = await request(app.getHttpServer())
            .patch(`/stores/${storeId}/orders/${orderId}/status`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: newStatus, comment: 'Test transition' })
            .expect(expectedStatus);

          if (isValid && expectedStatus === 200) {
            expect(response.body.status).toBe(newStatus);
          }

          if (expectedError) {
            expect(JSON.stringify(response.body)).toContain(expectedError);
          }

          if (checkHistory) {
            const history = await prisma.orderStatusHistory.findMany({
              where: { orderId: BigInt(orderId) },
            });
            expect(history.length).toBeGreaterThan(0);
            expect(history[0].toStatus).toBe(newStatus);
          }
        });
      },
    );
  });

  describe('Order Status - Authorization Tests', () => {
    it('should reject status update without auth (401)', async () => {
      const orderId = await createOrder('DRAFT');

      await request(app.getHttpServer())
        .patch(`/stores/${storeId}/orders/${orderId}/status`)
        .send({ status: 'PENDING_PAYMENT' })
        .expect(401);
    });

    it('should reject status update by non-owner (403)', async () => {
      const orderId = await createOrder('DRAFT');

      // Create another user
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other@example.com',
          password: 'Password123',
          fullName: 'Other User',
        });
      const otherToken = res.body.accessToken;

      await request(app.getHttpServer())
        .patch(`/stores/${storeId}/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ status: 'PENDING_PAYMENT' })
        .expect(403);
    });
  });
});
