# TTPU Market - Multi-Tenant Telegram E-Commerce Platform

A production-ready NestJS backend for a multi-tenant Telegram e-commerce platform. Each merchant can connect their own Telegram bot and sell products directly through Telegram.

## Features

- 🏪 **Multi-tenant Architecture** - Each store operates independently with its own Telegram bot
- 🤖 **Telegram Bot Integration** - Full-featured Telegram bot with catalog browsing, cart management, and checkout
- 💳 **Payment Processing** - Integration with Payme and Click payment providers (Uzbekistan)
- 🚚 **Delivery Management** - Store locations and delivery zones with pricing
- 🎟️ **Coupon System** - Percentage and fixed amount discounts with usage limits
- 📊 **Analytics** - Dashboard with revenue tracking, customer growth, and event analytics
- 📢 **CRM & Broadcasting** - Send promotional messages to customer segments
- 🌍 **Multi-language** - Support for Uzbek and Russian languages

## Tech Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS 10+
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis with BullMQ
- **Authentication**: JWT with Passport
- **Testing**: Jest + Supertest with table-driven tests
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- A Telegram Bot Token (from [@BotFather](https://t.me/botfather))

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd ttpu_market
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your settings:

```bash
# Generate a 64-character hex encryption key (32 bytes)
openssl rand -hex 32
```

**ENCRYPTION_KEY Format:**
- Must be exactly 32 bytes when decoded
- Accepted formats: 64-character hex string (e.g., `0123456789abcdef...`)
- Example: `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`

Update the `ENCRYPTION_KEY` in `.env` with the generated value.

### 3. Start with Docker Compose

```bash
docker compose up --build
```

This will:
- Start PostgreSQL database
- Start Redis server
- Build and run the API server
- Run database migrations automatically
- Seed the database with demo data

### 4. Access the Application

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

## Demo Credentials

After seeding, you can use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin123! |
| Merchant | merchant@example.com | Merchant123! |

## Testing

### Running Tests with Docker (Recommended)

```bash
# Start test database containers
docker compose -f docker-compose.test.yml up -d

# Wait for services to be ready
sleep 5

# Run migrations on test database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/tgshop_test npx prisma db push

# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Stop test containers
docker compose -f docker-compose.test.yml down
```

### Test Coverage

The test suite includes 20+ tests with table-driven tests covering:

1. **Auth Tests (8 cases)** - Registration/login validation, password policy, duplicate email, inactive user
2. **Store Tests (8 cases)** - Create/update stores, ownership validation, slug uniqueness
3. **Telegram Connect Tests (8 cases)** - Bot token validation, webhook setup (mocked)
4. **Telegram Webhook Tests (8 cases)** - Security, deduplication, callback_data parsing
5. **Order Status Tests (8 cases)** - Legal/illegal status transitions
6. **Payment Callback Tests (8 cases)** - Idempotency, signature verification, amount mismatch

### Test Files

```
test/
├── auth.e2e-spec.ts           # Auth register/login table-driven tests
├── stores.e2e-spec.ts         # Store CRUD ownership tests
├── telegram-connect.e2e-spec.ts # Telegram connection tests (mocked)
├── telegram-webhook.e2e-spec.ts # Webhook security/dedup tests
├── orders.e2e-spec.ts         # Order status transition tests
├── payments.e2e-spec.ts       # Payment callback tests
├── health.e2e-spec.ts         # Health check tests
└── app.e2e-spec.ts            # Basic app tests
```

## Local Development

### Without Docker

```bash
# Install dependencies
npm install

# Start PostgreSQL and Redis (you need these running locally)
# Or use Docker just for databases:
docker compose up -d postgres redis

# Run migrations
npx prisma db push

# Seed database
npx prisma db seed

# Start development server
npm run start:dev
```

### Setting Up for Local Telegram Testing with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Set TELEGRAM_WEBHOOK_BASE_URL in .env:
TELEGRAM_WEBHOOK_BASE_URL=https://abc123.ngrok.io

# Restart the server
npm run start:dev
```

### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (dev)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name <migration-name>

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## API Documentation

Once the server is running, visit http://localhost:3000/docs for interactive Swagger documentation.

### Main Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | `POST /auth/register` | Register new merchant |
| Auth | `POST /auth/login` | Login and get JWT token |
| Stores | `POST /stores` | Create new store |
| Stores | `GET /stores/:id` | Get store details |
| Telegram | `POST /stores/:storeId/telegram/connect` | Connect Telegram bot |
| Telegram | `POST /webhook/telegram/:storeId` | Telegram webhook (auto-configured) |
| Catalog | `GET /stores/:storeId/categories` | List categories |
| Catalog | `POST /stores/:storeId/products` | Create product |
| Orders | `GET /stores/:storeId/orders` | List orders |
| Orders | `PATCH /stores/:storeId/orders/:id/status` | Update order status |
| Analytics | `GET /stores/:storeId/analytics/dashboard` | Get dashboard data |

## Setting Up Telegram Bot

1. **Create a bot** with [@BotFather](https://t.me/botfather)
2. **Get your bot token** from BotFather
3. **Register as merchant** via `/auth/register`
4. **Create a store** via `POST /stores`
5. **Connect the bot** via `POST /stores/:storeId/telegram/connect`
   ```json
   {
     "token": "your-bot-token-from-botfather"
   }
   ```

The system will automatically:
- Validate the token
- Set up the webhook
- Start receiving messages

### Bot Commands

Users can interact with your bot using:
- `/start` - Start the bot and see main menu
- **📖 Каталог** - Browse products
- **🛒 Корзина** - View cart
- **📦 Мои заказы** - View order history
- **⚙️ Настройки** - Change language

## Payment Integration

### Payme (Uzbekistan)

1. Get credentials from [Payme Business](https://payme.uz/business)
2. Update store payment settings via API
3. Configure webhook URL in Payme dashboard: `https://your-domain.com/payments/callback/payme`

### Click (Uzbekistan)

1. Get credentials from [Click Merchant](https://click.uz/merchant)
2. Update store payment settings via API
3. Configure webhook URL in Click dashboard: `https://your-domain.com/payments/callback/click`

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── common/
│   ├── prisma/             # Database service
│   ├── redis/              # Redis/cache service
│   ├── utils/              # Utility functions
│   └── decorators/         # Custom decorators
├── auth/                   # Authentication module
├── health/                 # Health checks
├── stores/                 # Store management
├── telegram/               # Telegram bot integration
├── catalog/                # Categories & products
├── orders/                 # Order management
├── payments/               # Payment processing
├── delivery/               # Delivery zones & locations
├── coupons/                # Coupon system
├── crm/                    # Customer relationship & broadcasts
└── analytics/              # Analytics & events
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for JWT signing | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `ENCRYPTION_KEY` | 64-char hex for token encryption | Required |
| `TELEGRAM_API_URL` | Telegram Bot API URL | `https://api.telegram.org` |
| `WEBHOOK_BASE_URL` | Public URL for webhooks | Required for production |
| `PORT` | Server port | `3000` |

## Production Deployment

### Docker Production Build

```bash
docker build -t ttpu-market:latest .
```

### Required Steps

1. Set up PostgreSQL database
2. Set up Redis instance
3. Configure environment variables
4. Set up reverse proxy (nginx/Caddy) with SSL
5. Configure `WEBHOOK_BASE_URL` with your public HTTPS domain
6. Deploy container

### Health Monitoring

The `/health` endpoint returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

## License

MIT

## Support

For support, please open an issue in the repository.
