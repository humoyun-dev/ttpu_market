import type { ReactNode } from "react";

import { NAV_ITEMS } from "@/lib/constants/routes";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { requireRole } from "@/features/auth/auth.guard";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole("admin");

  return (
    <div className="flex">
      <Sidebar title="Admin" items={NAV_ITEMS.admin} />
      <div className="flex min-h-dvh flex-1 flex-col">
        <Topbar role="admin" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
