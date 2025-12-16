import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { TelegramApiService } from './telegram-api.service';
import { TelegramBotService } from './telegram-bot.service';
import { EventsService } from '../analytics/events.service';

// Menu text constants
const MENU_TEXT = {
  uz: {
    welcome: "Xush kelibsiz! Quyidagi menyu orqali xarid qiling:",
    catalog: '🛍 Katalog',
    cart: '🧺 Savat',
    orders: '📦 Buyurtmalarim',
    language: '🌐 Til',
    categories: 'Kategoriyalar:',
    products: 'Mahsulotlar:',
    addToCart: '➕ Savatga',
    back: '⬅️ Orqaga',
    cartEmpty: "Savatingiz bo'sh",
    cartItems: 'Savatingizda:',
    total: 'Jami:',
    checkout: '✅ Buyurtma berish',
    clear: '🗑 Tozalash',
    enterPhone: "Iltimos, telefon raqamingizni yuboring (kontakt orqali):",
    enterAddress: 'Yetkazib berish manzilini kiriting:',
    paymentMethod: "To'lov usulini tanlang:",
    cash: '💵 Naqd',
    orderCreated: '✅ Buyurtmangiz qabul qilindi!',
    orderNo: 'Buyurtma raqami:',
    noOrders: "Sizda hali buyurtmalar yo'q",
    yourOrders: 'Sizning buyurtmalaringiz:',
    selectLanguage: 'Tilni tanlang:',
    languageChanged: 'Til muvaffaqiyatli almashtirildi!',
    productAdded: 'Mahsulot savatga qoshildi!',
    quantity: 'Soni:',
    price: 'Narxi:',
    remove: '❌ Olib tashlash',
  },
  ru: {
    welcome: 'Добро пожаловать! Используйте меню для покупок:',
    catalog: '🛍 Каталог',
    cart: '🧺 Корзина',
    orders: '📦 Мои заказы',
    language: '🌐 Язык',
    categories: 'Категории:',
    products: 'Товары:',
    addToCart: '➕ В корзину',
    back: '⬅️ Назад',
    cartEmpty: 'Ваша корзина пуста',
    cartItems: 'В вашей корзине:',
    total: 'Итого:',
    checkout: '✅ Оформить заказ',
    clear: '🗑 Очистить',
    enterPhone: 'Пожалуйста, отправьте номер телефона (через контакт):',
    enterAddress: 'Введите адрес доставки:',
    paymentMethod: 'Выберите способ оплаты:',
    cash: '💵 Наличные',
    orderCreated: '✅ Ваш заказ принят!',
    orderNo: 'Номер заказа:',
    noOrders: 'У вас пока нет заказов',
    yourOrders: 'Ваши заказы:',
    selectLanguage: 'Выберите язык:',
    languageChanged: 'Язык успешно изменен!',
    productAdded: 'Товар добавлен в корзину!',
    quantity: 'Количество:',
    price: 'Цена:',
    remove: '❌ Удалить',
  },
};

@Injectable()
export class TelegramWebhookService {
  private readonly logger = new Logger(TelegramWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly telegramApi: TelegramApiService,
    private readonly botService: TelegramBotService,
    private readonly eventsService: EventsService,
  ) {}

  async handleWebhook(storeId: bigint, secret: string, update: any): Promise<void> {
    // Validate webhook secret
    const isValid = await this.botService.validateWebhookSecret(storeId, secret);
    if (!isValid) {
      this.logger.warn(`Invalid webhook secret for store ${storeId}`);
      return;
    }

    // Deduplicate updates
    const updateId = update.update_id;
    const dedupeKey = `tg:update:${storeId}:${updateId}`;
    const isNew = await this.redis.setnx(dedupeKey, '1', 7200); // 2 hours TTL

    if (!isNew) {
      this.logger.debug(`Duplicate update ${updateId} for store ${storeId}`);
      return;
    }

    try {
      // Get bot token
      const token = await this.botService.getDecryptedToken(storeId);

      if (update.message) {
        await this.handleMessage(storeId, token, update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(storeId, token, update.callback_query);
      }
    } catch (error) {
      this.logger.error(`Error handling webhook for store ${storeId}:`, error);
    }
  }

  private async handleMessage(storeId: bigint, token: string, message: any): Promise<void> {
    const chatId = message.chat.id;
    const telegramUserId = message.from.id;
    const text = message.text || '';

    // Get or create customer
    const customer = await this.getOrCreateCustomer(storeId, message.from);
    const lang = customer.languageCode as 'uz' | 'ru';
    const t = MENU_TEXT[lang] || MENU_TEXT.uz;

    // Get session
    const session = await this.getOrCreateSession(storeId, customer.id);

    // Handle contact sharing (phone)
    if (message.contact) {
      await this.handleContactShared(storeId, token, chatId, customer, session, message.contact);
      return;
    }

    // Handle based on text command or session state
    if (text === '/start') {
      await this.eventsService.track(storeId, customer.telegramUserId, 'start', {});
      await this.showMainMenu(token, chatId, t);
      await this.updateSessionState(session.id, 'idle', null);
    } else if (text === t.catalog || text === MENU_TEXT.uz.catalog || text === MENU_TEXT.ru.catalog) {
      await this.eventsService.track(storeId, customer.telegramUserId, 'view_catalog', {});
      await this.showCategories(storeId, token, chatId, lang);
    } else if (text === t.cart || text === MENU_TEXT.uz.cart || text === MENU_TEXT.ru.cart) {
      await this.showCart(storeId, token, chatId, customer, lang);
    } else if (text === t.orders || text === MENU_TEXT.uz.orders || text === MENU_TEXT.ru.orders) {
      await this.showOrders(storeId, token, chatId, customer, lang);
    } else if (text === t.language || text === MENU_TEXT.uz.language || text === MENU_TEXT.ru.language) {
      await this.showLanguageSelection(token, chatId);
    } else if (session.state === 'awaiting_address') {
      await this.handleAddressInput(storeId, token, chatId, customer, session, text, lang);
    } else {
      // Default: show main menu
      await this.showMainMenu(token, chatId, t);
    }
  }

  private async handleCallbackQuery(storeId: bigint, token: string, callbackQuery: any): Promise<void> {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;
    const telegramUserId = callbackQuery.from.id;

    // Acknowledge callback
    await this.telegramApi.answerCallbackQuery(token, callbackQuery.id);

    // Get customer
    const customer = await this.getOrCreateCustomer(storeId, callbackQuery.from);
    const lang = customer.languageCode as 'uz' | 'ru';
    const t = MENU_TEXT[lang] || MENU_TEXT.uz;

    // Parse callback data
    const [action, ...params] = data.split(':');

    switch (action) {
      case 'cat':
        await this.showCategoryProducts(storeId, token, chatId, BigInt(params[0]), lang);
        break;
      case 'prod':
        await this.showProductDetail(storeId, token, chatId, BigInt(params[0]), lang);
        break;
      case 'add':
        await this.addToCart(storeId, token, chatId, customer, BigInt(params[0]), lang);
        break;
      case 'remove':
        await this.removeFromCart(storeId, token, chatId, customer, BigInt(params[0]), lang);
        break;
      case 'checkout':
        await this.startCheckout(storeId, token, chatId, customer, lang);
        break;
      case 'clear':
        await this.clearCart(storeId, token, chatId, customer, lang);
        break;
      case 'pay':
        await this.handlePaymentChoice(storeId, token, chatId, customer, params[0], lang);
        break;
      case 'lang':
        await this.changeLanguage(storeId, token, chatId, customer, params[0]);
        break;
      case 'back':
        await this.showCategories(storeId, token, chatId, lang);
        break;
      case 'main':
        await this.showMainMenu(token, chatId, t);
        break;
    }
  }

  private async getOrCreateCustomer(storeId: bigint, from: any) {
    let customer = await this.prisma.telegramCustomer.findUnique({
      where: {
        storeId_telegramUserId: {
          storeId,
          telegramUserId: BigInt(from.id),
        },
      },
    });

    if (!customer) {
      customer = await this.prisma.telegramCustomer.create({
        data: {
          storeId,
          telegramUserId: BigInt(from.id),
          username: from.username,
          firstName: from.first_name,
          lastName: from.last_name,
          languageCode: from.language_code === 'ru' ? 'ru' : 'uz',
          lastActiveAt: new Date(),
        },
      });
    } else {
      await this.prisma.telegramCustomer.update({
        where: { id: customer.id },
        data: { lastActiveAt: new Date() },
      });
    }

    return customer;
  }

  private async getOrCreateSession(storeId: bigint, customerId: bigint) {
    let session = await this.prisma.telegramSession.findUnique({
      where: {
        storeId_telegramCustomerId: {
          storeId,
          telegramCustomerId: customerId,
        },
      },
    });

    if (!session) {
      session = await this.prisma.telegramSession.create({
        data: {
          storeId,
          telegramCustomerId: customerId,
          state: 'idle',
        },
      });
    }

    return session;
  }

  private async updateSessionState(sessionId: bigint, state: string, stateData: any) {
    await this.prisma.telegramSession.update({
      where: { id: sessionId },
      data: { state, stateData },
    });
  }

  private async showMainMenu(token: string, chatId: number, t: typeof MENU_TEXT.uz) {
    const keyboard = {
      keyboard: [
        [{ text: t.catalog }, { text: t.cart }],
        [{ text: t.orders }, { text: t.language }],
      ],
      resize_keyboard: true,
    };

    await this.telegramApi.sendMessage(token, chatId, t.welcome, {
      replyMarkup: keyboard,
    });
  }

  private async showCategories(storeId: bigint, token: string, chatId: number, lang: string) {
    const t = MENU_TEXT[lang as 'uz' | 'ru'] || MENU_TEXT.uz;
    
    const categories = await this.prisma.category.findMany({
      where: { storeId, isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
    });

    if (categories.length === 0) {
      await this.telegramApi.sendMessage(token, chatId, 'No categories available');
      return;
    }

    const buttons = categories.map((cat) => [
      {
        text: lang === 'ru' && cat.nameRu ? cat.nameRu : cat.name,
        callback_data: `cat:${cat.id}`,
      },
    ]);

    await this.telegramApi.sendMessage(token, chatId, t.categories, {
      replyMarkup: { inline_keyboard: buttons },
    });
  }

  private async showCategoryProducts(
    storeId: bigint,
    token: string,
    chatId: number,
    categoryId: bigint,
    lang: string,
  ) {
    const t = MENU_TEXT[lang as 'uz' | 'ru'] || MENU_TEXT.uz;

    const products = await this.prisma.product.findMany({
      where: { storeId, categoryId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (products.length === 0) {
      const buttons = [[{ text: t.back, callback_data: 'back' }]];
      await this.telegramApi.sendMessage(token, chatId, 'No products in this category', {
        replyMarkup: { inline_keyboard: buttons },
      });
      return;
    }

    const buttons = products.map((prod) => [
      {
        text: `${prod.name} - ${this.formatPrice(prod.price)}`,
        callback_data: `prod:${prod.id}`,
      },
    ]);

    buttons.push([{ text: t.back, callback_data: 'back' }]);

    await this.telegramApi.sendMessage(token, chatId, t.products, {
      replyMarkup: { inline_keyboard: buttons },
    });
  }

  private async showProductDetail(
    storeId: bigint,
    token: string,
    chatId: number,
    productId: bigint,
    lang: string,
  ) {
    const t = MENU_TEXT[lang as 'uz' | 'ru'] || MENU_TEXT.uz;

    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    });

    if (!product) {
      await this.telegramApi.sendMessage(token, chatId, 'Product not found');
      return;
    }

    const text = `*${product.name}*\n\n${product.description || ''}\n\n${t.price} ${this.formatPrice(product.price)}`;

    const buttons = [
      [{ text: t.addToCart, callback_data: `add:${product.id}` }],
      [{ text: t.back, callback_data: `cat:${product.categoryId}` }],
    ];

    if (product.images.length > 0) {
      await this.telegramApi.sendPhoto(token, chatId, product.images[0].url, {
        caption: text,
        parseMode: 'Markdown',
        replyMarkup: { inline_keyboard: buttons },
      });
    } else {
      await this.telegramApi.sendMessage(token, chatId, text, {
        parseMode: 'Markdown',
        replyMarkup: { inline_keyboard: buttons },
      });
    }
  }

  private async addToCart(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: any,
    productId: bigint,
    lang: string,
  ) {
    const t = MENU_TEXT[lang as 'uz' | 'ru'] || MENU_TEXT.uz;

    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: {
        storeId_telegramCustomerId: {
          storeId,
          telegramCustomerId: customer.id,
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          storeId,
          telegramCustomerId: customer.id,
        },
      });
    }

    // Check if item exists
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + 1 },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: 1,
        },
      });
    }

    await this.eventsService.track(storeId, customer.telegramUserId, 'add_to_cart', { productId: productId.toString() });

    await this.telegramApi.sendMessage(token, chatId, t.productAdded);
  }

  private async showCart(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: any,
    lang: string,
  ) {
    const t = MENU_TEXT[lang as 'uz' | 'ru'] || MENU_TEXT.uz;

    const cart = await this.prisma.cart.findUnique({
      where: {
        storeId_telegramCustomerId: {
          storeId,
          telegramCustomerId: customer.id,
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      await this.telegramApi.sendMessage(token, chatId, t.cartEmpty);
      return;
    }

    let text = `${t.cartItems}\n\n`;
    let total = BigInt(0);

    const buttons: any[][] = [];

    for (const item of cart.items) {
      const itemTotal = item.product.price * BigInt(item.quantity);
      total += itemTotal;
      text += `${item.product.name}\n${t.quantity} ${item.quantity} x ${this.formatPrice(item.product.price)} = ${this.formatPrice(itemTotal)}\n\n`;
      
      buttons.push([
        { text: `${t.remove} ${item.product.name}`, callback_data: `remove:${item.product.id}` },
      ]);
    }

    text += `\n${t.total} ${this.formatPrice(total)}`;

    buttons.push([{ text: t.checkout, callback_data: 'checkout' }]);
    buttons.push([{ text: t.clear, callback_data: 'clear' }]);

    await this.telegramApi.sendMessage(token, chatId, text, {
      replyMarkup: { inline_keyboard: buttons },
    });
  }

  private async removeFromCart(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: any,
    productId: bigint,
    lang: string,
  ) {
    const cart = await this.prisma.cart.findUnique({
      where: {
        storeId_telegramCustomerId: {
          storeId,
          telegramCustomerId: customer.id,
        },
      },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      });
    }

    await this.showCart(storeId, token, chatId, customer, lang);
  }

  private async clearCart(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: any,
    lang: string,
  ) {
    const t = MENU_TEXT[lang as 'uz' | 'ru'] || MENU_TEXT.uz;

    await this.prisma.cartItem.deleteMany({
      where: {
        cart: {
          storeId,
          telegramCustomerId: customer.id,
        },
      },
    });

    await this.telegramApi.sendMessage(token, chatId, t.cartEmpty);
  }

  private async startCheckout(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: any,
    lang: string,
  ) {
    const t = MENU_TEXT[lang as 'uz' | 'ru'] || MENU_TEXT.uz;

    await this.eventsService.track(storeId, customer.telegramUserId, 'checkout_started', {});

    // Check if phone is missing
    if (!customer.phone) {
      const session = await this.getOrCreateSession(storeId, customer.id);
      await this.updateSessionState(session.id, 'awaiting_phone', null);

      const keyboard = {
        keyboard: [[{ text: '📱 Share Contact', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      };

      await this.telegramApi.sendMessage(token, chatId, t.enterPhone, {
        replyMarkup: keyboard,
      });
      return;
    }

    // Ask for address
    const session = await this.getOrCreateSession(storeId, customer.id);
    await this.updateSessionState(session.id, 'awaiting_address', null);

    await this.telegramApi.sendMessage(token, chatId, t.enterAddress);
  }

  private async handleContactShared(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: any,
    session: any,
    contact: any,
  ) {
    const lang = customer.languageCode as 'uz' | 'ru';
    const t = MENU_TEXT[lang] || MENU_TEXT.uz;

    // Update customer phone
    await this.prisma.telegramCustomer.update({
      where: { id: customer.id },
      data: { phone: contact.phone_number },
    });

    // Ask for address
    await this.updateSessionState(session.id, 'awaiting_address', null);

    await this.telegramApi.sendMessage(token, chatId, t.enterAddress, {
      replyMarkup: { remove_keyboard: true },
    });
  }

  private async handleAddressInput(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: any,
    session: any,
    address: string,
    lang: string,
  ) {
    const t = MENU_TEXT[lang as 'uz' | 'ru'] || MENU_TEXT.uz;

    // Store address in session
    await this.updateSessionState(session.id, 'awaiting_payment', { address });

    // Show payment options
    const buttons = [[{ text: t.cash, callback_data: 'pay:cash' }]];

    await this.telegramApi.sendMessage(token, chatId, t.paymentMethod, {
      replyMarkup: { inline_keyboard: buttons },
    });
  }

  private async handlePaymentChoice(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: any,
    paymentMethod: string,
    lang: string,
  ) {
    const t = MENU_TEXT[lang as 'uz' | 'ru'] || MENU_TEXT.uz;

    // Get session data
    const session = await this.getOrCreateSession(storeId, customer.id);
    const stateData = session.stateData as any;
    const address = stateData?.address || '';

    // Get cart
    const cart = await this.prisma.cart.findUnique({
      where: {
        storeId_telegramCustomerId: {
          storeId,
          telegramCustomerId: customer.id,
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!cart || cart.items.length === 0) {
      await this.telegramApi.sendMessage(token, chatId, t.cartEmpty);
      return;
    }

    // Calculate total
    let subtotal = BigInt(0);
    for (const item of cart.items) {
      subtotal += item.product.price * BigInt(item.quantity);
    }

    // Generate order number
    const orderNo = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Get customer with fresh data
    const freshCustomer = await this.prisma.telegramCustomer.findUnique({
      where: { id: customer.id },
    });

    // Create order
    const order = await this.prisma.order.create({
      data: {
        storeId,
        telegramCustomerId: customer.id,
        orderNo,
        subtotal,
        total: subtotal,
        customerPhone: freshCustomer?.phone,
        deliveryAddress: address,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            total: item.product.price * BigInt(item.quantity),
          })),
        },
        statusHistory: {
          create: {
            toStatus: 'PENDING_PAYMENT',
            comment: 'Order created from Telegram',
          },
        },
      },
    });

    // Create payment record
    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: paymentMethod === 'cash' ? 'CASH' : 'PAYME',
        amount: subtotal,
        status: paymentMethod === 'cash' ? 'PENDING' : 'PENDING',
      },
    });

    // Clear cart
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Reset session
    await this.updateSessionState(session.id, 'idle', null);

    // Track event
    await this.eventsService.track(storeId, customer.telegramUserId, 'order_created', {
      orderId: order.id.toString(),
      total: subtotal.toString(),
    });

    // Send confirmation
    const confirmationText = `${t.orderCreated}\n\n${t.orderNo} ${orderNo}\n${t.total} ${this.formatPrice(subtotal)}`;

    await this.telegramApi.sendMessage(token, chatId, confirmationText);
    await this.showMainMenu(token, chatId, t);
  }

  private async showOrders(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: any,
    lang: string,
  ) {
    const t = MENU_TEXT[lang as 'uz' | 'ru'] || MENU_TEXT.uz;

    const orders = await this.prisma.order.findMany({
      where: {
        storeId,
        telegramCustomerId: customer.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (orders.length === 0) {
      await this.telegramApi.sendMessage(token, chatId, t.noOrders);
      return;
    }

    let text = `${t.yourOrders}\n\n`;

    for (const order of orders) {
      text += `#${order.orderNo}\n`;
      text += `${t.total} ${this.formatPrice(order.total)}\n`;
      text += `Status: ${order.status}\n`;
      text += `📅 ${order.createdAt.toLocaleDateString()}\n\n`;
    }

    await this.telegramApi.sendMessage(token, chatId, text);
  }

  private async showLanguageSelection(token: string, chatId: number) {
    const buttons = [
      [{ text: "🇺🇿 O'zbek", callback_data: 'lang:uz' }],
      [{ text: '🇷🇺 Русский', callback_data: 'lang:ru' }],
    ];

    await this.telegramApi.sendMessage(token, chatId, 'Tilni tanlang / Выберите язык:', {
      replyMarkup: { inline_keyboard: buttons },
    });
  }

  private async changeLanguage(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: any,
    newLang: string,
  ) {
    await this.prisma.telegramCustomer.update({
      where: { id: customer.id },
      data: { languageCode: newLang },
    });

    const t = MENU_TEXT[newLang as 'uz' | 'ru'] || MENU_TEXT.uz;
    await this.telegramApi.sendMessage(token, chatId, t.languageChanged);
    await this.showMainMenu(token, chatId, t);
  }

  private formatPrice(price: bigint): string {
    return `${Number(price).toLocaleString()} UZS`;
  }
}
