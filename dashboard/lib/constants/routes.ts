import type { Role } from "@/lib/constants/roles";

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

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    { href: ROUTES.admin.dashboard, label: "Dashboard", icon: "dashboard" },
    { href: ROUTES.admin.sellers, label: "Sellers", icon: "users" },
    { href: ROUTES.admin.stores, label: "Stores", icon: "store" },
    { href: ROUTES.admin.orders, label: "Orders", icon: "orders" },
    { href: ROUTES.admin.metrics, label: "Metrics", icon: "metrics" },
  ],
  seller: [
    { href: ROUTES.seller.dashboard, label: "Dashboard", icon: "dashboard" },
    { href: ROUTES.seller.storeSwitch, label: "Switch Store", icon: "switch" },
    { href: ROUTES.seller.products, label: "Products", icon: "products" },
    { href: ROUTES.seller.orders, label: "Orders", icon: "orders" },
    { href: ROUTES.seller.customers, label: "Customers", icon: "customers" },
    {
      href: ROUTES.seller.telegramSettings,
      label: "Telegram",
      icon: "telegram",
    },
    {
      href: ROUTES.seller.paymentsSettings,
      label: "Payments",
      icon: "payments",
    },
  ],
};

