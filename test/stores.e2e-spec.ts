import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Stores E2E Tests (Table-Driven)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let otherUserToken: string;
  let userId: bigint;
  let otherUserId: bigint;

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
    await prisma.store.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test users
    const res1 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'owner@example.com',
        password: 'Password123',
        fullName: 'Store Owner',
      });
    userToken = res1.body.accessToken;
    userId = BigInt(res1.body.user.id);

    const res2 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'other@example.com',
        password: 'Password123',
        fullName: 'Other User',
      });
    otherUserToken = res2.body.accessToken;
    otherUserId = BigInt(res2.body.user.id);
  });

  describe('POST /stores - Create Store (Table-Driven)', () => {
    const createStoreTestCases = [
      {
        name: 'should create store successfully with valid data',
        input: {
          name: 'My Store',
          slug: 'my-store',
          supportedLanguages: ['uz', 'ru'],
          defaultLanguage: 'uz',
        },
        expectedStatus: 201,
        expectedFields: ['id', 'name', 'slug'],
      },
      {
        name: 'should create store with minimal required fields',
        input: {
          name: 'Minimal Store',
          slug: 'minimal-store',
        },
        expectedStatus: 201,
        expectedFields: ['id', 'name'],
      },
      {
        name: 'should fail without authentication (401)',
        input: {
          name: 'Unauth Store',
          slug: 'unauth-store',
        },
        skipAuth: true,
        expectedStatus: 401,
      },
      {
        name: 'should fail with empty name',
        input: {
          name: '',
          slug: 'empty-name',
        },
        expectedStatus: 400,
        expectedError: 'name should not be empty',
      },
      {
        name: 'should fail with empty slug',
        input: {
          name: 'Valid Name',
          slug: '',
        },
        expectedStatus: 400,
        expectedError: 'slug should not be empty',
      },
      {
        name: 'should fail with invalid slug format (spaces)',
        input: {
          name: 'Valid Name',
          slug: 'invalid slug',
        },
        expectedStatus: 400,
        expectedError: 'Slug must contain only lowercase letters',
      },
      {
        name: 'should fail with duplicate slug (409)',
        input: {
          name: 'Duplicate Store',
          slug: 'duplicate-slug',
        },
        setup: async (token: string) => {
          await request(app.getHttpServer())
            .post('/stores')
            .set('Authorization', `Bearer ${token}`)
            .send({
              name: 'First Store',
              slug: 'duplicate-slug',
            });
        },
        expectedStatus: 409,
        expectedError: 'Store slug already exists',
      },
      {
        name: 'should fail with missing required fields',
        input: {},
        expectedStatus: 400,
        expectedError: 'name should not be empty',
      },
    ];

    createStoreTestCases.forEach(
      ({ name, input, expectedStatus, expectedFields, expectedError, skipAuth, setup }) => {
        it(name, async () => {
          if (setup) await setup(userToken);

          let req = request(app.getHttpServer()).post('/stores');
          if (!skipAuth) {
            req = req.set('Authorization', `Bearer ${userToken}`);
          }

          const response = await req.send(input).expect(expectedStatus);

          if (expectedFields) {
            expectedFields.forEach((field) => {
              expect(response.body).toHaveProperty(field);
            });
          }

          if (expectedError) {
            expect(JSON.stringify(response.body)).toContain(expectedError);
          }
        });
      },
    );
  });

  describe('PATCH /stores/:id - Update Store (Table-Driven)', () => {
    let storeId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Store',
          slug: 'test-store',
        });
      storeId = res.body.id;
    });

    const updateStoreTestCases = [
      {
        name: 'should update store name successfully',
        input: { name: 'Updated Store Name' },
        expectedStatus: 200,
        validateResponse: (body: any) => body.name === 'Updated Store Name',
      },
      {
        name: 'should update multiple fields',
        input: {
          name: 'New Name',
          description: 'New Description',
        },
        expectedStatus: 200,
        validateResponse: (body: any) =>
          body.name === 'New Name' && body.description === 'New Description',
      },
      {
        name: 'should fail without authentication (401)',
        input: { name: 'Updated' },
        skipAuth: true,
        expectedStatus: 401,
      },
      {
        name: 'should fail when other user tries to update (403)',
        input: { name: 'Hacked Name' },
        useOtherUser: true,
        expectedStatus: 403,
        expectedError: 'forbidden',
      },
      {
        name: 'should fail with non-existent store (404)',
        input: { name: 'Ghost Store' },
        useNonExistentId: true,
        expectedStatus: 404,
      },
      {
        name: 'should fail with invalid id format',
        input: { name: 'Invalid' },
        useInvalidId: true,
        expectedStatus: 400,
      },
      {
        name: 'should ignore unknown fields (whitelist)',
        input: {
          name: 'Valid Update',
          unknownField: 'should be ignored',
        },
        expectedStatus: 400, // forbidNonWhitelisted is true
        expectedError: 'property unknownField should not exist',
      },
      {
        name: 'should handle empty update body',
        input: {},
        expectedStatus: 200, // No changes, but valid request
      },
    ];

    updateStoreTestCases.forEach(
      ({
        name,
        input,
        expectedStatus,
        expectedError,
        skipAuth,
        useOtherUser,
        useNonExistentId,
        useInvalidId,
        validateResponse,
      }) => {
        it(name, async () => {
          let targetId = storeId;
          if (useNonExistentId) targetId = '999999999';
          if (useInvalidId) targetId = 'invalid-id';

          let req = request(app.getHttpServer()).patch(`/stores/${targetId}`);
          if (!skipAuth) {
            const token = useOtherUser ? otherUserToken : userToken;
            req = req.set('Authorization', `Bearer ${token}`);
          }

          const response = await req.send(input).expect(expectedStatus);

          if (validateResponse) {
            expect(validateResponse(response.body)).toBe(true);
          }

          if (expectedError) {
            expect(JSON.stringify(response.body).toLowerCase()).toContain(
              expectedError.toLowerCase(),
            );
          }
        });
      },
    );
  });

  describe('GET /stores - List Stores (Ownership)', () => {
    beforeEach(async () => {
      // Create stores for different users
      await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Owner Store 1', slug: 'owner-1' });

      await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Owner Store 2', slug: 'owner-2' });

      await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ name: 'Other Store', slug: 'other-1' });
    });

    it('should return only stores owned by the authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/stores')
        .set('Authorization', `Bearer ${userToken}`);

      if (response.status !== 200) {
        console.log('Error response:', response.body);
      }
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      response.body.forEach((store: any) => {
        expect(['Owner Store 1', 'Owner Store 2']).toContain(store.name);
      });
    });

    it('should return different stores for different user', async () => {
      const response = await request(app.getHttpServer())
        .get('/stores')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Other Store');
    });
  });
});
