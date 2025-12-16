import { PrismaClient, UserRole, StoreStatus, PaymentProvider } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      fullName: 'Admin User',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log('Created admin user:', admin.email);

  // Create merchant user
  const merchantPassword = await bcrypt.hash('Merchant123!', 10);
  const merchant = await prisma.user.upsert({
    where: { email: 'merchant@example.com' },
    update: {},
    create: {
      email: 'merchant@example.com',
      password: merchantPassword,
      fullName: 'Demo Merchant',
      role: UserRole.MERCHANT,
      isActive: true,
    },
  });
  console.log('Created merchant user:', merchant.email);

  // Create sample store for merchant
  const store = await prisma.store.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      ownerId: merchant.id,
      name: 'Demo Store',
      slug: 'demo',
      description: 'A demo e-commerce store',
      supportedLanguages: ['uz', 'ru'],
      defaultLanguage: 'uz',
      currency: 'UZS',
      timezone: 'Asia/Tashkent',
      status: StoreStatus.ACTIVE,
    },
  });
  console.log('Created store:', store.name);

  // Create sample categories
  const category1 = await prisma.category.upsert({
    where: { storeId_slug: { storeId: store.id, slug: 'electronics' } },
    update: {},
    create: {
      storeId: store.id,
      name: 'Elektronika',
      nameRu: 'Электроника',
      slug: 'electronics',
      sortOrder: 1,
      isActive: true,
    },
  });

  const category2 = await prisma.category.upsert({
    where: { storeId_slug: { storeId: store.id, slug: 'clothing' } },
    update: {},
    create: {
      storeId: store.id,
      name: 'Kiyim-kechak',
      nameRu: 'Одежда',
      slug: 'clothing',
      sortOrder: 2,
      isActive: true,
    },
  });
  console.log('Created categories');

  // Create sample products
  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      {
        storeId: store.id,
        categoryId: category1.id,
        name: 'Smartfon',
        description: 'Zamonaviy smartfon',
        price: BigInt(3500000),
        stockQty: 50,
        isActive: true,
        sortOrder: 1,
      },
      {
        storeId: store.id,
        categoryId: category1.id,
        name: 'Noutbuk',
        description: 'Kuchli noutbuk',
        price: BigInt(12000000),
        stockQty: 20,
        isActive: true,
        sortOrder: 2,
      },
      {
        storeId: store.id,
        categoryId: category2.id,
        name: 'Futbolka',
        description: 'Paxta futbolka',
        price: BigInt(150000),
        stockQty: 100,
        isActive: true,
        sortOrder: 1,
      },
    ],
  });
  console.log('Created products');

  // Create payment settings
  await prisma.paymentSetting.createMany({
    skipDuplicates: true,
    data: [
      {
        storeId: store.id,
        provider: PaymentProvider.CASH,
        isEnabled: true,
      },
      {
        storeId: store.id,
        provider: PaymentProvider.PAYME,
        isEnabled: false,
      },
      {
        storeId: store.id,
        provider: PaymentProvider.CLICK,
        isEnabled: false,
      },
    ],
  });
  console.log('Created payment settings');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
