import type { ReactNode } from "react";

import { NAV_ITEMS } from "@/lib/constants/routes";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { requireRole } from "@/features/auth/auth.guard";

export default async function SellerLayout({ children }: { children: ReactNode }) {
  await requireRole("seller");

  return (
    <div className="flex">
      <Sidebar title="Seller" items={NAV_ITEMS.seller} />
      <div className="flex min-h-dvh flex-1 flex-col">
        <Topbar role="seller" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
