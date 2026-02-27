"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Package,
  Repeat2,
  ShoppingBag,
  Store,
  Users,
  UsersRound,
  WalletCards,
} from "lucide-react";

import type { NavItem } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function getIcon(icon: NavItem["icon"]) {
  switch (icon) {
    case "dashboard":
      return LayoutDashboard;
    case "users":
      return UsersRound;
    case "store":
      return Store;
    case "orders":
      return ShoppingBag;
    case "metrics":
      return BarChart3;
    case "products":
      return Package;
    case "customers":
      return Users;
    case "telegram":
      return Repeat2;
    case "payments":
      return WalletCards;
    case "switch":
      return Store;
    default:
      return LayoutDashboard;
  }
}

export function Sidebar({
  title,
  items,
}: {
  title: string;
  items: NavItem[];
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="px-4 py-4">
        <div className="text-sm font-semibold tracking-tight">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">TTPU Market</div>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-2">
        {items.map((item) => {
          const Icon = getIcon(item.icon);
          const active = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "w-full justify-start gap-2",
                active && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 text-xs text-muted-foreground">
        <div>Strict mode UI</div>
      </div>
    </aside>
  );
}

