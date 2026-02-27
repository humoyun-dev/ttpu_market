import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants/routes";
import type { Role } from "@/lib/constants/roles";
import { getMeServer } from "@/features/auth/auth.guard";

export async function requireAnyRole(roles: Role[]) {
  const session = await getMeServer();
  if (!session || !roles.includes(session.user.role)) {
    redirect(ROUTES.login);
  }
  return session;
}

