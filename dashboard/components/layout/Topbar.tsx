"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

import type { Role } from "@/lib/constants/roles";
import { ROUTES } from "@/lib/constants/routes";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";

function deleteCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function Topbar({ role }: { role: Role }) {
  const router = useRouter();
  const setActiveStoreId = useAuthStore((s) => s.setActiveStoreId);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const roleLabel = role === "admin" ? "Platform Admin" : "Merchant / Store Owner";

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
      <Breadcrumbs />
      <div className="flex items-center gap-2">
        <div className="hidden text-xs text-muted-foreground sm:block">
          Role: <span className="font-medium text-foreground">{roleLabel}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Account menu">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={loggingOut}
              onClick={async () => {
                try {
                  setLoggingOut(true);
                  await logout();
                } finally {
                  setActiveStoreId(null);
                  deleteCookie("ttpu_store_id");
                  setLoggingOut(false);
                  router.push(ROUTES.login);
                }
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
