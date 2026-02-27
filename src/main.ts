import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

// BigInt JSON serialization fix for Prisma
declare global {
  interface BigInt {
    toJSON(): string;
  }
}
BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const apiPrefix = 'api/v1';

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3100')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  // Cookies (for HttpOnly auth + CSRF token)
  app.use(cookieParser());

  // Versioned API prefix (exclude external callbacks/webhooks from breaking changes)
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'payments/payme/callback', method: RequestMethod.POST },
      { path: 'payments/click/callback', method: RequestMethod.POST },
      { path: 'telegram/webhook/(.*)', method: RequestMethod.POST },
      { path: 'seller-bot/webhook/(.*)', method: RequestMethod.POST },
    ],
  });

  // CSRF/origin protection for cookie-authenticated browser requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();

    // Block cross-site form/fetch attempts (browser requests carry Origin for unsafe methods)
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({ code: 'CSRF_ORIGIN', message: 'Forbidden' });
    }

    // Enforce CSRF header only when using cookie auth (non-browser clients typically use bearer auth)
    const hasAuthCookie = Boolean(req.cookies?.access_token);
    if (!hasAuthCookie) return next();

    const csrfCookie = req.cookies?.csrf_token;
    const csrfHeader = req.headers['x-csrf-token'];
    if (typeof csrfHeader !== 'string' || !csrfCookie || csrfHeader !== csrfCookie) {
      return res.status(403).json({ code: 'CSRF_TOKEN_INVALID', message: 'Invalid CSRF token' });
    }

    return next();
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Telegram E-Commerce Platform API')
    .setDescription('Multi-tenant Telegram e-commerce platform API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/${apiPrefix}/docs`);
}
bootstrap();
