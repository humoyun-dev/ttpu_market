import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { I18nService } from '../common/i18n';
import { RedisService } from '../common/redis/redis.service';
import { TelegramApiService } from './telegram-api.service';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramRegistrationService } from './telegram-registration.service';
import { CustomerBotState } from './fsm/customer-registration-state-machine';
import { EventsService } from '../analytics/events.service';

@Injectable()
export class TelegramWebhookService {
  private readonly logger = new Logger(TelegramWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly telegramApi: TelegramApiService,
    private readonly botService: TelegramBotService,
    private readonly registrationService: TelegramRegistrationService,
    private readonly i18nService: I18nService,
    private readonly eventsService: EventsService,
  ) {}

  async handleWebhook(storeId: bigint, secret: string, update: any): Promise<void> {
    // Validate webhook secret
    const isValid = await this.botService.validateWebhookSecret(storeId, secret);
    if (!isValid) {
      this.logger.warn(`Invalid webhook secret for store ${storeId}`);
      throw new ForbiddenException('Invalid webhook secret');
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
    const chatId = message.chat?.id;
    const from = message.from;
    if (!chatId || !from?.id) {
      return;
    }

    const text = typeof message.text === 'string' ? message.text.trim() : '';
    const startState = await this.registrationService.start(storeId, {
      telegramUserId: String(from.id),
      firstName: from.first_name || 'Customer',
      lastName: from.last_name,
      username: from.username,
    });
    const language = this.resolveLang(startState.languageCode ?? from.language_code);

    if (text === '/start') {
      await this.eventsService.track(storeId, BigInt(from.id), 'start', {});
      if (startState.state === CustomerBotState.IDLE) {
        await this.showMainMenu(token, chatId, language);
      } else {
        await this.showLanguageSelection(token, chatId, language);
      }
      return;
    }

    if (message.contact) {
      try {
        await this.registrationService.completeContact(storeId, {
          telegramUserId: String(from.id),
          contactUserId: String(message.contact.user_id ?? ''),
          phone: message.contact.phone_number ?? '',
        });

        await this.telegramApi.sendMessage(
          token,
          chatId,
          this.t('ecommerce.checkout.enterAddress', language),
          { replyMarkup: { remove_keyboard: true } },
        );
      } catch {
        await this.telegramApi.sendMessage(
          token,
          chatId,
          this.t('common.errors.invalidContactOwner', language),
        );
        await this.sendCheckoutContactRequest(token, chatId, language);
      }
      return;
    }

    const context = await this.registrationService.getContext(storeId, String(from.id));

    if (context.session.state === CustomerBotState.AWAITING_ADDRESS && text.length > 0) {
      await this.handleAddressInput(
        storeId,
        token,
        chatId,
        context.customer,
        context.session,
        text,
        context.customer.languageCode,
      );
      return;
    }

    if (context.session.state !== CustomerBotState.IDLE) {
      await this.handleIncompleteRegistration(
        token,
        chatId,
        context.customer.languageCode,
        context.session.state,
      );
      return;
    }

    await this.showMainMenu(token, chatId, context.customer.languageCode);
  }

  private async handleCallbackQuery(storeId: bigint, token: string, callbackQuery: any): Promise<void> {
    const chatId = callbackQuery.message?.chat?.id;
    const data = callbackQuery.data;
    const telegramUserId = callbackQuery.from?.id;
    if (!chatId || !telegramUserId || typeof data !== 'string') {
      return;
    }

    // Acknowledge callback
    await this.telegramApi.answerCallbackQuery(token, callbackQuery.id);

    const startState = await this.registrationService.start(storeId, {
      telegramUserId: String(telegramUserId),
      firstName: callbackQuery.from?.first_name || 'Customer',
      lastName: callbackQuery.from?.last_name,
      username: callbackQuery.from?.username,
    });

    const fallbackLang = this.resolveLang(startState.languageCode ?? callbackQuery.from?.language_code);

    // Parse callback data
    const [action, ...params] = data.split(':');

    if (action === 'lang') {
      const nextLanguage = this.resolveLang(params[0], fallbackLang);
      await this.registrationService.selectLanguage(storeId, {
        telegramUserId: String(telegramUserId),
        languageCode: nextLanguage,
      });
      await this.telegramApi.sendMessage(
        token,
        chatId,
        this.t('ecommerce.info.languageUpdated', nextLanguage),
      );
      await this.showMainMenu(token, chatId, nextLanguage);
      return;
    }

    const context = await this.registrationService.getContext(storeId, String(telegramUserId));
    const lang = context.customer.languageCode;
    if (context.session.state !== CustomerBotState.IDLE) {
      await this.handleIncompleteRegistration(token, chatId, lang, context.session.state);
      return;
    }

    switch (action) {
      case 'main': {
        const target = params[0];
        if (target === 'catalog') {
          await this.eventsService.track(storeId, context.customer.telegramUserId, 'view_catalog', {});
          await this.showCategories(storeId, token, chatId, lang);
        } else if (target === 'cart') {
          await this.showCart(storeId, token, chatId, context.customer, lang);
        } else if (target === 'orders') {
          await this.showOrders(storeId, token, chatId, context.customer, lang);
        } else if (target === 'language') {
          await this.showLanguageSelection(token, chatId, lang);
        } else {
          await this.showMainMenu(token, chatId, lang);
        }
        break;
      }
      case 'cat':
        await this.showCategoryProducts(storeId, token, chatId, BigInt(params[0]), lang);
        break;
      case 'prod':
        await this.showProductDetail(storeId, token, chatId, BigInt(params[0]), lang);
        break;
      case 'add':
        await this.addToCart(storeId, token, chatId, context.customer, BigInt(params[0]), lang);
        break;
      case 'remove':
        await this.removeFromCart(storeId, token, chatId, context.customer, BigInt(params[0]), lang);
        break;
      case 'checkout':
        await this.startCheckout(storeId, token, chatId, context.customer, lang);
        break;
      case 'clear':
        await this.clearCart(storeId, token, chatId, context.customer, lang);
        break;
      case 'pay':
        await this.handlePaymentChoice(storeId, token, chatId, context.customer, params[0], lang);
        break;
      case 'back':
        await this.showCategories(storeId, token, chatId, lang);
        break;
      case 'menu':
        await this.showMainMenu(token, chatId, lang);
        break;
      default:
        await this.showMainMenu(token, chatId, lang);
    }
  }

  private async showMainMenu(token: string, chatId: number, languageCode: string) {
    const keyboard = {
      inline_keyboard: [
        [
          { text: this.t('ecommerce.menu.catalog', languageCode), callback_data: 'main:catalog' },
          { text: this.t('ecommerce.menu.cart', languageCode), callback_data: 'main:cart' },
        ],
        [
          { text: this.t('ecommerce.menu.orders', languageCode), callback_data: 'main:orders' },
          { text: this.t('ecommerce.menu.language', languageCode), callback_data: 'main:language' },
        ],
      ],
    };

    await this.telegramApi.sendMessage(token, chatId, this.t('ecommerce.menu.title', languageCode), {
      replyMarkup: keyboard,
    });
  }

  private async handleIncompleteRegistration(
    token: string,
    chatId: number,
    languageCode: string,
    state: CustomerBotState,
  ) {
    if (state === CustomerBotState.LANG_SELECT || state === CustomerBotState.NEW) {
      await this.showLanguageSelection(token, chatId, languageCode);
      return;
    }

    if (state === CustomerBotState.AWAITING_CONTACT) {
      await this.sendCheckoutContactRequest(token, chatId, languageCode);
      return;
    }

    if (state === CustomerBotState.AWAITING_ADDRESS) {
      await this.telegramApi.sendMessage(
        token,
        chatId,
        this.t('ecommerce.checkout.enterAddress', languageCode),
      );
      return;
    }

    if (state === CustomerBotState.AWAITING_PAYMENT) {
      await this.telegramApi.sendMessage(
        token,
        chatId,
        this.t('ecommerce.checkout.paymentMethod', languageCode),
        {
          replyMarkup: {
            inline_keyboard: [
              [{ text: this.t('ecommerce.checkout.cash', languageCode), callback_data: 'pay:cash' }],
            ],
          },
        },
      );
      return;
    }

    await this.telegramApi.sendMessage(
      token,
      chatId,
      this.t('common.errors.registrationRequired', languageCode),
    );
  }

  private async sendCheckoutContactRequest(token: string, chatId: number, languageCode: string) {
    const keyboard = {
      keyboard: [
        [
          {
            text: this.t('common.actions.shareContact', languageCode),
            request_contact: true,
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    };

    await this.telegramApi.sendMessage(
      token,
      chatId,
      this.t('ecommerce.checkout.contactRequired', languageCode),
      { replyMarkup: keyboard },
    );
  }

  private async showCategories(storeId: bigint, token: string, chatId: number, lang: string) {
    const categories = await this.prisma.category.findMany({
      where: { storeId, isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
    });

    if (categories.length === 0) {
      await this.telegramApi.sendMessage(token, chatId, this.t('ecommerce.product.noCategories', lang));
      return;
    }

    const buttons = categories.map((category) => [
      {
        text: lang === 'ru' && category.nameRu ? category.nameRu : category.name,
        callback_data: `cat:${category.id}`,
      },
    ]);

    await this.telegramApi.sendMessage(token, chatId, this.t('ecommerce.menu.categories', lang), {
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
    const products = await this.prisma.product.findMany({
      where: { storeId, categoryId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (products.length === 0) {
      const buttons = [[{ text: this.t('ecommerce.menu.back', lang), callback_data: 'back' }]];
      await this.telegramApi.sendMessage(token, chatId, this.t('ecommerce.product.noProducts', lang), {
        replyMarkup: { inline_keyboard: buttons },
      });
      return;
    }

    const buttons = products.map((product) => [
      {
        text: `${product.name} - ${this.formatPrice(product.price)}`,
        callback_data: `prod:${product.id}`,
      },
    ]);
    buttons.push([{ text: this.t('ecommerce.menu.back', lang), callback_data: 'back' }]);

    await this.telegramApi.sendMessage(token, chatId, this.t('ecommerce.menu.products', lang), {
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
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    });

    if (!product) {
      await this.telegramApi.sendMessage(token, chatId, this.t('ecommerce.product.notFound', lang));
      return;
    }

    const text = `*${product.name}*\n\n${product.description || ''}\n\n${this.t(
      'ecommerce.checkout.price',
      lang,
    )} ${this.formatPrice(product.price)}`;

    const buttons = [
      [{ text: this.t('ecommerce.checkout.addToCart', lang), callback_data: `add:${product.id}` }],
      [{ text: this.t('ecommerce.menu.back', lang), callback_data: `cat:${product.categoryId}` }],
    ];

    if (product.images.length > 0) {
      await this.telegramApi.sendPhoto(token, chatId, product.images[0].url, {
        caption: text,
        parseMode: 'Markdown',
        replyMarkup: { inline_keyboard: buttons },
      });
      return;
    }

    await this.telegramApi.sendMessage(token, chatId, text, {
      parseMode: 'Markdown',
      replyMarkup: { inline_keyboard: buttons },
    });
  }

  private async addToCart(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: { id: bigint; telegramUserId: bigint },
    productId: bigint,
    lang: string,
  ) {
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

    await this.eventsService.track(storeId, customer.telegramUserId, 'add_to_cart', {
      productId: productId.toString(),
    });

    await this.telegramApi.sendMessage(token, chatId, this.t('ecommerce.product.added', lang));
  }

  private async showCart(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: { id: bigint; telegramUserId: bigint },
    lang: string,
  ) {
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
      await this.telegramApi.sendMessage(token, chatId, this.t('ecommerce.checkout.cartEmpty', lang));
      return;
    }

    let text = `${this.t('ecommerce.checkout.cartItems', lang)}\n\n`;
    let total = BigInt(0);
    const buttons: Array<Array<{ text: string; callback_data: string }>> = [];

    for (const item of cart.items) {
      const itemTotal = item.product.price * BigInt(item.quantity);
      total += itemTotal;
      text += `${item.product.name}\n${this.t('ecommerce.checkout.quantity', lang)} ${item.quantity} x ${this.formatPrice(item.product.price)} = ${this.formatPrice(itemTotal)}\n\n`;
      buttons.push([
        {
          text: `${this.t('ecommerce.checkout.remove', lang)} ${item.product.name}`,
          callback_data: `remove:${item.product.id}`,
        },
      ]);
    }

    text += `\n${this.t('ecommerce.checkout.total', lang)} ${this.formatPrice(total)}`;

    buttons.push([{ text: this.t('ecommerce.checkout.checkout', lang), callback_data: 'checkout' }]);
    buttons.push([{ text: this.t('ecommerce.checkout.clear', lang), callback_data: 'clear' }]);

    await this.telegramApi.sendMessage(token, chatId, text, {
      replyMarkup: { inline_keyboard: buttons },
    });
  }

  private async removeFromCart(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: { id: bigint; telegramUserId: bigint },
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
    customer: { id: bigint; telegramUserId: bigint },
    lang: string,
  ) {
    await this.prisma.cartItem.deleteMany({
      where: {
        cart: {
          storeId,
          telegramCustomerId: customer.id,
        },
      },
    });

    await this.telegramApi.sendMessage(token, chatId, this.t('ecommerce.checkout.cartEmpty', lang));
  }

  private async startCheckout(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: { id: bigint; telegramUserId: bigint; languageCode: string },
    lang: string,
  ) {
    await this.eventsService.track(storeId, customer.telegramUserId, 'checkout_started', {});

    const checkoutState = await this.registrationService.requireContactForCheckout(
      storeId,
      customer.telegramUserId.toString(),
    );

    if (checkoutState.state === CustomerBotState.AWAITING_CONTACT) {
      await this.sendCheckoutContactRequest(token, chatId, lang);
      return;
    }

    await this.telegramApi.sendMessage(token, chatId, this.t('ecommerce.checkout.enterAddress', lang));
  }

  private async handleAddressInput(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: { telegramUserId: bigint; languageCode: string },
    session: { state: CustomerBotState },
    address: string,
    lang: string,
  ) {
    if (session.state !== CustomerBotState.AWAITING_ADDRESS) {
      await this.handleIncompleteRegistration(token, chatId, lang, session.state);
      return;
    }

    await this.registrationService.setAwaitingPayment(storeId, customer.telegramUserId.toString(), address);
    const buttons = [[{ text: this.t('ecommerce.checkout.cash', lang), callback_data: 'pay:cash' }]];

    await this.telegramApi.sendMessage(token, chatId, this.t('ecommerce.checkout.paymentMethod', lang), {
      replyMarkup: { inline_keyboard: buttons },
    });
  }

  private async handlePaymentChoice(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: { id: bigint; telegramUserId: bigint; languageCode: string },
    paymentMethod: string,
    lang: string,
  ) {
    const context = await this.registrationService.getContext(storeId, customer.telegramUserId.toString());
    if (context.session.state !== CustomerBotState.AWAITING_PAYMENT) {
      await this.handleIncompleteRegistration(token, chatId, lang, context.session.state);
      return;
    }

    const address = context.session.stateData?.address || '';

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
      await this.telegramApi.sendMessage(token, chatId, this.t('ecommerce.checkout.cartEmpty', lang));
      return;
    }

    let subtotal = BigInt(0);
    for (const item of cart.items) {
      subtotal += item.product.price * BigInt(item.quantity);
    }

    const orderNo = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const freshCustomer = await this.prisma.telegramCustomer.findUnique({
      where: { id: customer.id },
    });

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

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: paymentMethod === 'cash' ? 'CASH' : 'PAYME',
        amount: subtotal,
        status: 'PENDING',
      },
    });

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    await this.registrationService.setIdle(storeId, customer.telegramUserId.toString());

    await this.eventsService.track(storeId, customer.telegramUserId, 'order_created', {
      orderId: order.id.toString(),
      total: subtotal.toString(),
    });

    const confirmationText = `${this.t('ecommerce.checkout.orderCreated', lang)}\n\n${this.t(
      'ecommerce.checkout.orderNo',
      lang,
    )} ${orderNo}\n${this.t('ecommerce.checkout.total', lang)} ${this.formatPrice(subtotal)}`;

    await this.telegramApi.sendMessage(token, chatId, confirmationText);
    await this.showMainMenu(token, chatId, lang);
  }

  private async showOrders(
    storeId: bigint,
    token: string,
    chatId: number,
    customer: { id: bigint },
    lang: string,
  ) {
    const orders = await this.prisma.order.findMany({
      where: {
        storeId,
        telegramCustomerId: customer.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (orders.length === 0) {
      await this.telegramApi.sendMessage(token, chatId, this.t('ecommerce.orders.noOrders', lang));
      return;
    }

    let text = `${this.t('ecommerce.orders.yourOrders', lang)}\n\n`;
    for (const order of orders) {
      text += `#${order.orderNo}\n`;
      text += `${this.t('ecommerce.checkout.total', lang)} ${this.formatPrice(order.total)}\n`;
      text += `${this.t('ecommerce.orders.status', lang)}: ${order.status}\n`;
      text += `📅 ${order.createdAt.toLocaleDateString()}\n\n`;
    }

    await this.telegramApi.sendMessage(token, chatId, text);
  }

  private async showLanguageSelection(token: string, chatId: number, languageCode: string) {
    const buttons = [
      [
        { text: this.t('common.language.uz', languageCode), callback_data: 'lang:uz' },
        { text: this.t('common.language.ru', languageCode), callback_data: 'lang:ru' },
        { text: this.t('common.language.en', languageCode), callback_data: 'lang:en' },
      ],
    ];

    await this.telegramApi.sendMessage(
      token,
      chatId,
      this.t('ecommerce.registration.selectLanguage', languageCode),
      {
        replyMarkup: { inline_keyboard: buttons },
      },
    );
  }

  private resolveLang(preferred?: string, fallback?: string): 'uz' | 'ru' | 'en' {
    const fallbackLang = this.i18nService.resolveLanguage(fallback);
    return this.i18nService.resolveLanguage(preferred, fallbackLang);
  }

  private t(key: string, languageCode: string): string {
    return this.i18nService.t(key, languageCode);
  }

  private formatPrice(price: bigint): string {
    return `${Number(price).toLocaleString()} UZS`;
  }
}
