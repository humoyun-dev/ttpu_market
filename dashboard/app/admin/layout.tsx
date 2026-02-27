import type { ReactNode } from "react";

import { adminNav } from "@/lib/constants/adminNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { requireRole } from "@/features/auth/auth.guard";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole("admin");

  return (
    <div className="flex">
      <Sidebar title="Platform Admin" items={adminNav} />
      <div className="flex min-h-dvh flex-1 flex-col">
        <Topbar role="admin" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
