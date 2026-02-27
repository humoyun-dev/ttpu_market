import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants/routes";
import type { Role } from "@/lib/constants/roles";
import { getMeServer } from "@/features/auth/auth.guard";
import { toDashboardRole } from "@/features/auth/auth.types";

export async function requireAnyRole(roles: Role[]) {
  const session = await getMeServer();
  if (!session || !roles.includes(toDashboardRole(session.role))) {
    redirect(ROUTES.login);
  }
  return session;
}
