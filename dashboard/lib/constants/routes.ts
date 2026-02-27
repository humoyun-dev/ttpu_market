export type NavItem = {
  href: string;
  label: string;
  icon?:
    | "dashboard"
    | "users"
    | "store"
    | "orders"
    | "metrics"
    | "products"
    | "customers"
    | "telegram"
    | "payments"
    | "switch";
};

export const ROUTES = {
  login: "/login",
  admin: {
    dashboard: "/admin/dashboard",
    sellers: "/admin/sellers",
    stores: "/admin/stores",
    orders: "/admin/orders",
    metrics: "/admin/metrics",
  },
  seller: {
    dashboard: "/seller/dashboard",
    storeSwitch: "/seller/store/switch",
    products: "/seller/products",
    orders: "/seller/orders",
    customers: "/seller/customers",
    telegramSettings: "/seller/settings/telegram",
    paymentsSettings: "/seller/settings/payments",
  },
} as const;
