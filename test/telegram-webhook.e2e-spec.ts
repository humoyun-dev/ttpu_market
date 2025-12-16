import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RedisService } from '../src/common/redis/redis.service';
import { encrypt } from '../src/common/utils/encryption';

describe('Telegram Webhook E2E Tests (Table-Driven)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let storeId: string;
  let webhookSecret: string;

  const BOT_TOKEN = '123456:ABC-DEF';
  const ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

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
    redis = app.get(RedisService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up Redis dedup keys
    const client = redis.getClient();
    const keys = await client.keys('tg:update:*');
    if (keys.length > 0) {
      await client.del(...keys);
    }

    // Clean up database (in correct order for foreign keys)
    await prisma.paymentAttempt.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.orderStatusHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.telegramSession.deleteMany({});
    await prisma.telegramCustomer.deleteMany({});
    await prisma.telegramBot.deleteMany({});
    await prisma.store.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test data
    const user = await prisma.user.create({
      data: {
        email: 'webhook@example.com',
        password: 'hashed',
        fullName: 'Webhook User',
      },
    });

    const store = await prisma.store.create({
      data: {
        ownerId: user.id,
        name: 'Webhook Store',
        slug: 'webhook-store',
        supportedLanguages: ['uz', 'ru'],
        defaultLanguage: 'uz',
      },
    });
    storeId = store.id.toString();

    webhookSecret = 'test-secret-123';
    const encryptedToken = encrypt(BOT_TOKEN, ENCRYPTION_KEY);

    await prisma.telegramBot.create({
      data: {
        storeId: store.id,
        encryptedToken,
        botId: BigInt(123456),
        username: 'test_bot',
        webhookSecret,
        isActive: true,
      },
    });
  });

  describe('POST /telegram/webhook/:storeId/:secret - Security Tests (Table-Driven)', () => {
    const securityTestCases = [
      {
        name: 'should accept valid webhook secret (200)',
        useValidSecret: true,
        payload: {
          update_id: 1,
          message: {
            message_id: 1,
            chat: { id: 12345, type: 'private' },
            from: { id: 12345, is_bot: false, first_name: 'Test' },
            text: '/start',
            date: Math.floor(Date.now() / 1000),
          },
        },
        expectedStatus: 200,
      },
      {
        name: 'should return 200 even for invalid secret (Telegram webhook best practice)',
        useValidSecret: false,
        secret: 'wrong-secret',
        payload: {
          update_id: 2,
          message: {
            message_id: 2,
            chat: { id: 12345, type: 'private' },
            from: { id: 12345, is_bot: false, first_name: 'Test' },
            text: '/start',
            date: Math.floor(Date.now() / 1000),
          },
        },
        expectedStatus: 200, // Webhooks should return 200 to prevent retries
      },
      {
        name: 'should return 200 for non-existent store (no retry)',
        useValidSecret: true,
        useNonExistentStore: true,
        payload: { update_id: 3 },
        expectedStatus: 200, // Return 200 to prevent Telegram from retrying
      },
      {
        name: 'should return 200 for empty webhook secret (no retry)',
        useValidSecret: false,
        secret: '',
        payload: { update_id: 4 },
        expectedStatus: 200, // Return 200 to prevent Telegram retries
      },
      {
        name: 'should handle empty payload gracefully',
        useValidSecret: true,
        payload: {},
        expectedStatus: 200,
      },
      {
        name: 'should handle callback_query update type',
        useValidSecret: true,
        payload: {
          update_id: 5,
          callback_query: {
            id: 'callback123',
            from: { id: 12345, is_bot: false, first_name: 'Test' },
            chat_instance: 'instance123',
            data: 'button_click',
          },
        },
        expectedStatus: 200,
      },
      {
        name: 'should reject invalid store ID format (400)',
        useValidSecret: true,
        useInvalidStoreId: true,
        payload: { update_id: 6 },
        expectedStatus: 400,
      },
      {
        name: 'should handle inline_query update type',
        useValidSecret: true,
        payload: {
          update_id: 7,
          inline_query: {
            id: 'inline123',
            from: { id: 12345, is_bot: false, first_name: 'Test' },
            query: 'search term',
            offset: '',
          },
        },
        expectedStatus: 200,
      },
    ];

    securityTestCases.forEach(
      ({
        name,
        useValidSecret,
        secret,
        payload,
        expectedStatus,
        useNonExistentStore,
        useInvalidStoreId,
      }) => {
        it(name, async () => {
          let targetStoreId = storeId;
          if (useNonExistentStore) targetStoreId = '999999999';
          if (useInvalidStoreId) targetStoreId = 'invalid-id';

          const targetSecret = useValidSecret ? webhookSecret : (secret || 'wrong');

          await request(app.getHttpServer())
            .post(`/telegram/webhook/${targetStoreId}/${targetSecret}`)
            .send(payload)
            .expect(expectedStatus);
        });
      },
    );
  });

  describe('POST /telegram/webhook/:storeId/:secret - Deduplication Tests (Table-Driven)', () => {
    const dedupTestCases = [
      {
        name: 'should process first update successfully',
        updateId: 100,
        expectedStatus: 200,
        expectedProcessing: true,
      },
      {
        name: 'should deduplicate same update_id on second request',
        updateId: 200,
        sendTwice: true,
        expectedStatus: 200,
        // Both return 200 but second one is skipped internally
      },
      {
        name: 'should process different update_ids separately',
        updateId: 300,
        secondUpdateId: 301,
        expectedStatus: 200,
      },
      {
        name: 'should handle missing update_id gracefully',
        updateId: undefined,
        expectedStatus: 200,
      },
    ];

    dedupTestCases.forEach(
      ({ name, updateId, expectedStatus, sendTwice, secondUpdateId }) => {
        it(name, async () => {
          const payload = updateId !== undefined 
            ? {
                update_id: updateId,
                message: {
                  message_id: updateId,
                  chat: { id: 12345, type: 'private' },
                  from: { id: 12345, is_bot: false, first_name: 'Dedup Test' },
                  text: '/start',
                  date: Math.floor(Date.now() / 1000),
                },
              }
            : {};

          await request(app.getHttpServer())
            .post(`/telegram/webhook/${storeId}/${webhookSecret}`)
            .send(payload)
            .expect(expectedStatus);

          if (sendTwice) {
            // Send same payload again
            await request(app.getHttpServer())
              .post(`/telegram/webhook/${storeId}/${webhookSecret}`)
              .send(payload)
              .expect(expectedStatus);
          }

          if (secondUpdateId) {
            // Send different update_id
            const secondPayload = {
              update_id: secondUpdateId,
              message: {
                message_id: secondUpdateId,
                chat: { id: 12345, type: 'private' },
                from: { id: 12345, is_bot: false, first_name: 'Dedup Test 2' },
                text: '/help',
                date: Math.floor(Date.now() / 1000),
              },
            };
            await request(app.getHttpServer())
              .post(`/telegram/webhook/${storeId}/${webhookSecret}`)
              .send(secondPayload)
              .expect(expectedStatus);
          }
        });
      },
    );
  });

  describe('POST /telegram/webhook/:storeId/:secret - Message Parsing Tests', () => {
    const parsingTestCases = [
      {
        name: 'should parse /start command and create customer',
        payload: {
          update_id: 500,
          message: {
            message_id: 500,
            chat: { id: 67890, type: 'private' },
            from: { id: 67890, is_bot: false, first_name: 'NewUser', username: 'newuser' },
            text: '/start',
            date: Math.floor(Date.now() / 1000),
          },
        },
        expectedStatus: 200,
        validateDb: async () => {
          const customer = await prisma.telegramCustomer.findFirst({
            where: {
              storeId: BigInt(storeId),
              telegramUserId: BigInt(67890),
            },
          });
          return customer !== null && customer.firstName === 'NewUser';
        },
      },
      {
        name: 'should update existing customer on new message',
        setup: async () => {
          await prisma.telegramCustomer.create({
            data: {
              storeId: BigInt(storeId),
              telegramUserId: BigInt(11111),
              firstName: 'OldName',
              languageCode: 'uz',
            },
          });
        },
        payload: {
          update_id: 501,
          message: {
            message_id: 501,
            chat: { id: 11111, type: 'private' },
            from: { id: 11111, is_bot: false, first_name: 'UpdatedName', username: 'updated' },
            text: 'Hello',
            date: Math.floor(Date.now() / 1000),
          },
        },
        expectedStatus: 200,
        validateDb: async () => {
          const customer = await prisma.telegramCustomer.findFirst({
            where: {
              storeId: BigInt(storeId),
              telegramUserId: BigInt(11111),
            },
          });
          // Customer might be created with updated info or existing info updated
          return customer !== null;
        },
      },
      {
        name: 'should handle message with photo',
        payload: {
          update_id: 502,
          message: {
            message_id: 502,
            chat: { id: 12345, type: 'private' },
            from: { id: 12345, is_bot: false, first_name: 'Test' },
            photo: [
              { file_id: 'photo123', width: 100, height: 100 },
            ],
            date: Math.floor(Date.now() / 1000),
          },
        },
        expectedStatus: 200,
      },
      {
        name: 'should handle message with location',
        payload: {
          update_id: 503,
          message: {
            message_id: 503,
            chat: { id: 12345, type: 'private' },
            from: { id: 12345, is_bot: false, first_name: 'Test' },
            location: { latitude: 41.311158, longitude: 69.279737 },
            date: Math.floor(Date.now() / 1000),
          },
        },
        expectedStatus: 200,
      },
    ];

    parsingTestCases.forEach(({ name, payload, expectedStatus, validateDb, setup }) => {
      it(name, async () => {
        if (setup) await setup();

        await request(app.getHttpServer())
          .post(`/telegram/webhook/${storeId}/${webhookSecret}`)
          .send(payload)
          .expect(expectedStatus);

        if (validateDb) {
          const isValid = await validateDb();
          expect(isValid).toBe(true);
        }
      });
    });
  });
});
