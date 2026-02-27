import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env/env";
import { ROUTES } from "@/lib/constants/routes";
import type { Role } from "@/lib/constants/roles";
import type { AuthSession } from "@/features/auth/auth.types";
import { mockCookies, mockGetMe } from "@/features/auth/mocks";

export async function getMeServer(): Promise<AuthSession | null> {
  if (!env.NEXT_PUBLIC_USE_MOCKS) {
    return null;
  }

  const cookieStore = await cookies();
  const role = cookieStore.get(mockCookies.ROLE_COOKIE)?.value as
    | Role
    | undefined;
  if (!role) return null;

  const storeId = cookieStore.get(mockCookies.STORE_COOKIE)?.value ?? null;
  const session = mockGetMe(role);
  return { ...session, activeStoreId: storeId };
}

export async function requireRole(role: Role): Promise<AuthSession> {
  const session = await getMeServer();
  if (!session || session.user.role !== role) {
    redirect(ROUTES.login);
  }
  return session;
}
