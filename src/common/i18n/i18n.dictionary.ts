import type { AppLanguage } from './i18n.types';

export const I18N_MESSAGES: Record<AppLanguage, Record<string, unknown>> = {
  uz: {
    common: {
      language: {
        uz: '🇺🇿 Oʻzbekcha',
        ru: '🇷🇺 Русский',
        en: '🇬🇧 English',
      },
      actions: {
        back: '⬅️ Orqaga',
        menu: '🏠 Menyu',
        shareContact: '📱 Kontakt yuborish',
      },
      errors: {
        unsupportedAction: 'Noto‘g‘ri amal. Qaytadan urinib ko‘ring.',
        registrationRequired: "Ro'yxatdan o'tish tugallanmaguncha amal bajarib bo'lmaydi.",
        invalidContactOwner:
          'Xavfsizlik xatosi: yuborilgan kontakt sizga tegishli emas. Iltimos, o‘z kontaktingizni yuboring.',
        invalidPhone: "Telefon raqami noto'g'ri formatda.",
      },
    },
    seller: {
      registration: {
        selectLanguage: 'Tilni tanlang:',
        shareContact: 'Davom etish uchun telefon raqamingizni kontakt orqali yuboring.',
        complete: "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi.",
      },
      menu: {
        title: 'Seller bot menyusi:',
        stores: '🏪 Do‘konlar',
        products: '📦 Mahsulotlar',
        orders: '🧾 Buyurtmalar',
        connectBot: '🤖 Bot ulash',
        language: '🌐 Til',
      },
      info: {
        chooseLanguage: 'Til yangilandi.',
        notImplemented: 'Bu bo‘lim keyingi bosqichda ishga tushiriladi.',
      },
    },
    ecommerce: {
      registration: {
        selectLanguage: 'Tilni tanlang:',
        complete: 'Ro‘yxatdan o‘tish yakunlandi. Menyudan foydalanishingiz mumkin.',
      },
      menu: {
        title: 'Xush kelibsiz! Kerakli bo‘limni tanlang:',
        catalog: '🛍 Katalog',
        cart: '🧺 Savat',
        orders: '📦 Buyurtmalarim',
        language: '🌐 Til',
        categories: 'Kategoriyalar:',
        products: 'Mahsulotlar:',
        back: '⬅️ Orqaga',
      },
      checkout: {
        contactRequired: 'Buyurtmani davom ettirish uchun kontaktingizni yuboring.',
        enterAddress: 'Yetkazib berish manzilini kiriting:',
        paymentMethod: "To'lov usulini tanlang:",
        cash: '💵 Naqd',
        addToCart: '➕ Savatga',
        checkout: '✅ Buyurtma berish',
        clear: '🗑 Tozalash',
        cartEmpty: "Savatingiz bo'sh",
        cartItems: 'Savatingizda:',
        remove: '❌ Olib tashlash',
        total: 'Jami:',
        quantity: 'Soni:',
        price: 'Narxi:',
        orderCreated: '✅ Buyurtmangiz qabul qilindi!',
        orderNo: 'Buyurtma raqami:',
      },
      orders: {
        noOrders: "Sizda hali buyurtmalar yo'q",
        yourOrders: 'Sizning buyurtmalaringiz:',
        status: 'Holat',
      },
      product: {
        added: "Mahsulot savatga qo'shildi!",
        notFound: 'Mahsulot topilmadi',
        noCategories: 'Kategoriyalar mavjud emas',
        noProducts: 'Bu kategoriyada mahsulot yo‘q',
      },
      info: {
        languageUpdated: 'Til muvaffaqiyatli o‘zgartirildi.',
      },
    },
  },
  ru: {
    common: {
      language: {
        uz: '🇺🇿 Oʻzbekcha',
        ru: '🇷🇺 Русский',
        en: '🇬🇧 English',
      },
      actions: {
        back: '⬅️ Назад',
        menu: '🏠 Меню',
        shareContact: '📱 Отправить контакт',
      },
      errors: {
        unsupportedAction: 'Некорректное действие. Повторите попытку.',
        registrationRequired: 'Доступ ограничен до завершения регистрации.',
        invalidContactOwner:
          'Ошибка безопасности: отправленный контакт вам не принадлежит. Отправьте свой контакт.',
        invalidPhone: 'Неверный формат номера телефона.',
      },
    },
    seller: {
      registration: {
        selectLanguage: 'Выберите язык:',
        shareContact: 'Для продолжения отправьте номер телефона через контакт.',
        complete: 'Регистрация успешно завершена.',
      },
      menu: {
        title: 'Меню продавца:',
        stores: '🏪 Магазины',
        products: '📦 Товары',
        orders: '🧾 Заказы',
        connectBot: '🤖 Подключить бота',
        language: '🌐 Язык',
      },
      info: {
        chooseLanguage: 'Язык обновлен.',
        notImplemented: 'Этот раздел будет доступен на следующем этапе.',
      },
    },
    ecommerce: {
      registration: {
        selectLanguage: 'Выберите язык:',
        complete: 'Регистрация завершена. Можно пользоваться меню.',
      },
      menu: {
        title: 'Добро пожаловать! Выберите раздел:',
        catalog: '🛍 Каталог',
        cart: '🧺 Корзина',
        orders: '📦 Мои заказы',
        language: '🌐 Язык',
        categories: 'Категории:',
        products: 'Товары:',
        back: '⬅️ Назад',
      },
      checkout: {
        contactRequired: 'Для продолжения заказа отправьте свой контакт.',
        enterAddress: 'Введите адрес доставки:',
        paymentMethod: 'Выберите способ оплаты:',
        cash: '💵 Наличные',
        addToCart: '➕ В корзину',
        checkout: '✅ Оформить заказ',
        clear: '🗑 Очистить',
        cartEmpty: 'Ваша корзина пуста',
        cartItems: 'В вашей корзине:',
        remove: '❌ Удалить',
        total: 'Итого:',
        quantity: 'Количество:',
        price: 'Цена:',
        orderCreated: '✅ Ваш заказ принят!',
        orderNo: 'Номер заказа:',
      },
      orders: {
        noOrders: 'У вас пока нет заказов',
        yourOrders: 'Ваши заказы:',
        status: 'Статус',
      },
      product: {
        added: 'Товар добавлен в корзину!',
        notFound: 'Товар не найден',
        noCategories: 'Категории недоступны',
        noProducts: 'В этой категории пока нет товаров',
      },
      info: {
        languageUpdated: 'Язык успешно обновлен.',
      },
    },
  },
  en: {
    common: {
      language: {
        uz: '🇺🇿 Oʻzbekcha',
        ru: '🇷🇺 Русский',
        en: '🇬🇧 English',
      },
      actions: {
        back: '⬅️ Back',
        menu: '🏠 Menu',
        shareContact: '📱 Share contact',
      },
      errors: {
        unsupportedAction: 'Invalid action. Please try again.',
        registrationRequired: 'Registration must be completed before using this action.',
        invalidContactOwner:
          'Security error: shared contact does not belong to your account. Please share your own contact.',
        invalidPhone: 'Phone format is invalid.',
      },
    },
    seller: {
      registration: {
        selectLanguage: 'Select language:',
        shareContact: 'To continue, share your phone number using contact button.',
        complete: 'Registration completed successfully.',
      },
      menu: {
        title: 'Seller menu:',
        stores: '🏪 Stores',
        products: '📦 Products',
        orders: '🧾 Orders',
        connectBot: '🤖 Connect Bot',
        language: '🌐 Language',
      },
      info: {
        chooseLanguage: 'Language updated.',
        notImplemented: 'This section will be available in the next phase.',
      },
    },
    ecommerce: {
      registration: {
        selectLanguage: 'Select language:',
        complete: 'Registration completed. You can use the menu now.',
      },
      menu: {
        title: 'Welcome! Choose a section:',
        catalog: '🛍 Catalog',
        cart: '🧺 Cart',
        orders: '📦 My Orders',
        language: '🌐 Language',
        categories: 'Categories:',
        products: 'Products:',
        back: '⬅️ Back',
      },
      checkout: {
        contactRequired: 'Share your contact to continue checkout.',
        enterAddress: 'Enter delivery address:',
        paymentMethod: 'Select payment method:',
        cash: '💵 Cash',
        addToCart: '➕ Add to cart',
        checkout: '✅ Checkout',
        clear: '🗑 Clear',
        cartEmpty: 'Your cart is empty',
        cartItems: 'Your cart:',
        remove: '❌ Remove',
        total: 'Total:',
        quantity: 'Qty:',
        price: 'Price:',
        orderCreated: '✅ Your order has been created!',
        orderNo: 'Order number:',
      },
      orders: {
        noOrders: "You don't have any orders yet",
        yourOrders: 'Your orders:',
        status: 'Status',
      },
      product: {
        added: 'Product added to cart!',
        notFound: 'Product not found',
        noCategories: 'No categories available',
        noProducts: 'No products in this category',
      },
      info: {
        languageUpdated: 'Language updated successfully.',
      },
    },
  },
};
