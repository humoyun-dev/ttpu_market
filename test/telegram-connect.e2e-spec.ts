import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Telegram Connect E2E Tests (Table-Driven)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let otherUserToken: string;
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
    await prisma.telegramBot.deleteMany({});
    await prisma.store.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user and store
    const res1 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'telegram@example.com',
        password: 'Password123',
        fullName: 'Telegram User',
      });
    userToken = res1.body.accessToken;

    // Create another user
    const res3 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'other@example.com',
        password: 'Password123',
        fullName: 'Other User',
      });
    otherUserToken = res3.body.accessToken;

    const res2 = await request(app.getHttpServer())
      .post('/stores')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Telegram Store',
        slug: 'telegram-store',
      });
    storeId = res2.body.id;
  });

  describe('POST /stores/:storeId/telegram/connect - Input Validation (Table-Driven)', () => {
    const validationTestCases = [
      {
        name: 'should fail with empty token',
        input: { token: '' },
        expectedStatus: 400,
        // Not found because validation/API rejects empty
      },
      {
        name: 'should fail with missing token field',
        input: {},
        expectedStatus: 400,
        expectedError: 'token must be a string',
      },
      {
        name: 'should fail without authentication (401)',
        input: { token: '123456:ABC-DEF' },
        skipAuth: true,
        expectedStatus: 401,
      },
      {
        name: 'should fail for non-existent store (404)',
        input: { token: '123456:ABC-DEF' },
        useNonExistentStore: true,
        expectedStatus: 404,
      },
      {
        name: 'should fail for non-owner trying to connect (403)',
        input: { token: '123456:ABC-DEF' },
        useOtherUser: true,
        expectedStatus: 403,
        expectedError: 'forbidden',
      },
      {
        name: 'should reject unknown fields (forbidNonWhitelisted)',
        input: { token: '123456:ABC-DEF', unknownField: 'value' },
        expectedStatus: 400,
        expectedError: 'property unknownField should not exist',
      },
      {
        name: 'should fail with invalid store ID format',
        input: { token: '123456:ABC-DEF' },
        useInvalidStoreId: true,
        expectedStatus: 400,
        expectedError: 'Invalid ID format',
      },
      {
        name: 'should reject invalid token from Telegram API',
        input: { token: 'definitely-invalid-token' },
        expectedStatus: 400,
        // Note: This will make actual call and Telegram returns 404
      },
    ];

    validationTestCases.forEach(
      ({
        name,
        input,
        expectedStatus,
        expectedError,
        skipAuth,
        useNonExistentStore,
        useOtherUser,
        useInvalidStoreId,
      }) => {
        it(
          name,
          async () => {
            let targetStoreId = storeId;
            if (useNonExistentStore) targetStoreId = '999999999';
            if (useInvalidStoreId) targetStoreId = 'invalid-id';

            let req = request(app.getHttpServer()).post(
              `/stores/${targetStoreId}/telegram/connect`,
            );

            if (!skipAuth) {
              const token = useOtherUser ? otherUserToken : userToken;
              req = req.set('Authorization', `Bearer ${token}`);
            }

            const response = await req.send(input).expect(expectedStatus);

            if (expectedError) {
              expect(JSON.stringify(response.body).toLowerCase()).toContain(
                expectedError.toLowerCase(),
              );
            }
          },
          10000,
        );
      },
    );
  });

  describe('GET /stores/:storeId/telegram/bot - Bot Status Tests', () => {
    const botStatusTestCases = [
      {
        name: 'should return 404 when no bot is connected',
        expectedStatus: 404,
        expectedError: 'No Telegram bot connected',
      },
      {
        name: 'should fail without authentication (401)',
        skipAuth: true,
        expectedStatus: 401,
      },
      {
        name: 'should fail for non-owner (403)',
        useOtherUser: true,
        expectedStatus: 403,
      },
      {
        name: 'should fail for non-existent store (404)',
        useNonExistentStore: true,
        expectedStatus: 404,
      },
    ];

    botStatusTestCases.forEach(
      ({ name, expectedStatus, expectedError, skipAuth, useOtherUser, useNonExistentStore }) => {
        it(name, async () => {
          let targetStoreId = storeId;
          if (useNonExistentStore) targetStoreId = '999999999';

          let req = request(app.getHttpServer()).get(
            `/stores/${targetStoreId}/telegram/bot`,
          );

          if (!skipAuth) {
            const token = useOtherUser ? otherUserToken : userToken;
            req = req.set('Authorization', `Bearer ${token}`);
          }

          const response = await req.expect(expectedStatus);

          if (expectedError) {
            expect(JSON.stringify(response.body)).toContain(expectedError);
          }
        });
      },
    );
  });
});
