import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Auth E2E Tests (Table-Driven)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
    // Clean up in correct order (respect foreign key constraints)
    await prisma.store.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('POST /auth/register - Table-Driven Tests', () => {
    const registerTestCases = [
      {
        name: 'should register successfully with valid data',
        input: {
          email: 'test@example.com',
          password: 'Password123',
          fullName: 'Test User',
        },
        expectedStatus: 201,
        expectedFields: ['accessToken', 'user'],
      },
      {
        name: 'should fail with invalid email format',
        input: {
          email: 'invalid-email',
          password: 'Password123',
          fullName: 'Test User',
        },
        expectedStatus: 400,
        expectedError: 'email must be an email',
      },
      {
        name: 'should fail with password too short (< 8 chars)',
        input: {
          email: 'test@example.com',
          password: 'Pass1',
          fullName: 'Test User',
        },
        expectedStatus: 400,
        expectedError: 'password must be longer than or equal to 8 characters',
      },
      {
        name: 'should fail with password missing number',
        input: {
          email: 'test@example.com',
          password: 'PasswordOnly',
          fullName: 'Test User',
        },
        expectedStatus: 400,
        expectedError: 'Password must contain at least 1 letter and 1 number',
      },
      {
        name: 'should fail with password missing letter',
        input: {
          email: 'test@example.com',
          password: '12345678',
          fullName: 'Test User',
        },
        expectedStatus: 400,
        expectedError: 'Password must contain at least 1 letter and 1 number',
      },
      {
        name: 'should fail with empty email',
        input: {
          email: '',
          password: 'Password123',
          fullName: 'Test User',
        },
        expectedStatus: 400,
        expectedError: 'email should not be empty',
      },
      {
        name: 'should fail with missing fullName',
        input: {
          email: 'test@example.com',
          password: 'Password123',
        },
        expectedStatus: 400,
        expectedError: 'fullName should not be empty',
      },
      {
        name: 'should fail with duplicate email (409)',
        input: {
          email: 'duplicate@example.com',
          password: 'Password123',
          fullName: 'Test User',
        },
        setup: async () => {
          await prisma.user.create({
            data: {
              email: 'duplicate@example.com',
              password: 'hashed',
              fullName: 'Existing User',
            },
          });
        },
        expectedStatus: 409,
        expectedError: 'Email already registered',
      },
    ];

    registerTestCases.forEach(
      ({ name, input, expectedStatus, expectedFields, expectedError, setup }) => {
        it(name, async () => {
          if (setup) await setup();

          const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send(input)
            .expect(expectedStatus);

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

  describe('POST /auth/login - Table-Driven Tests', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'login@example.com',
          password: 'Password123',
          fullName: 'Login User',
        });
    });

    const loginTestCases = [
      {
        name: 'should login successfully with valid credentials',
        input: {
          email: 'login@example.com',
          password: 'Password123',
        },
        expectedStatus: 200,
        expectedFields: ['accessToken', 'user'],
      },
      {
        name: 'should fail with wrong password',
        input: {
          email: 'login@example.com',
          password: 'WrongPassword123',
        },
        expectedStatus: 401,
        expectedError: 'Invalid credentials',
      },
      {
        name: 'should fail with non-existent email',
        input: {
          email: 'nonexistent@example.com',
          password: 'Password123',
        },
        expectedStatus: 401,
        expectedError: 'Invalid credentials',
      },
      {
        name: 'should fail with invalid email format',
        input: {
          email: 'not-an-email',
          password: 'Password123',
        },
        expectedStatus: 400,
        expectedError: 'email must be an email',
      },
      {
        name: 'should fail with empty password',
        input: {
          email: 'login@example.com',
          password: '',
        },
        expectedStatus: 400,
        expectedError: 'password should not be empty',
      },
      {
        name: 'should fail with missing email field',
        input: {
          password: 'Password123',
        },
        expectedStatus: 400,
        expectedError: 'email',
      },
      {
        name: 'should fail with missing password field',
        input: {
          email: 'login@example.com',
        },
        expectedStatus: 400,
        expectedError: 'password should not be empty',
      },
      {
        name: 'should fail for inactive user (403)',
        input: {
          email: 'inactive@example.com',
          password: 'Password123',
        },
        setup: async () => {
          const bcrypt = require('bcrypt');
          await prisma.user.create({
            data: {
              email: 'inactive@example.com',
              password: await bcrypt.hash('Password123', 10),
              fullName: 'Inactive User',
              isActive: false,
            },
          });
        },
        expectedStatus: 401,
        expectedError: 'Account is disabled',
      },
    ];

    loginTestCases.forEach(
      ({ name, input, expectedStatus, expectedFields, expectedError, setup }) => {
        it(name, async () => {
          if (setup) await setup();

          const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send(input)
            .expect(expectedStatus);

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
});
