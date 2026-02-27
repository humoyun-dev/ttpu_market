import { ROUTES, type NavItem } from "@/lib/constants/routes";

export const adminNav: NavItem[] = [
  { href: ROUTES.admin.dashboard, label: "Dashboard", icon: "dashboard" },
  { href: ROUTES.admin.sellers, label: "Merchants", icon: "users" },
  { href: ROUTES.admin.stores, label: "Stores", icon: "store" },
  { href: ROUTES.admin.orders, label: "Orders", icon: "orders" },
  { href: ROUTES.admin.metrics, label: "Metrics", icon: "metrics" },
];
