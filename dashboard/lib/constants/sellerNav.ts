import { ROUTES, type NavItem } from "@/lib/constants/routes";

export const sellerNav: NavItem[] = [
  { href: ROUTES.seller.dashboard, label: "Dashboard", icon: "dashboard" },
  { href: ROUTES.seller.stores, label: "Stores", icon: "store" },
  { href: ROUTES.seller.products, label: "Products", icon: "products" },
  { href: ROUTES.seller.orders, label: "Orders", icon: "orders" },
  { href: ROUTES.seller.customers, label: "Customers", icon: "customers" },
  { href: ROUTES.seller.telegramSettings, label: "Telegram", icon: "telegram" },
  { href: ROUTES.seller.paymentsSettings, label: "Payments", icon: "payments" },
];
