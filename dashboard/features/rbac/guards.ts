import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants/routes";
import type { Role } from "@/lib/constants/roles";
import { getMeServer } from "@/features/auth/auth.guard";
import { toDashboardRole } from "@/features/auth/auth.types";

export async function requireAnyRole(roles: Role[]) {
  const session = await getMeServer();
  const role = session ? toDashboardRole(session.role) : null;
  if (!session || !role || !roles.includes(role)) {
    redirect(ROUTES.login);
  }
  return session;
}
