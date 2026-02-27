import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants/routes";
import type { Role } from "@/lib/constants/roles";
import { httpClient } from "@/lib/http/client";
import type { ApiAuthMe } from "@/features/auth/auth.types";
import { toDashboardRole } from "@/features/auth/auth.types";

function buildCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  const parts = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`);
  return parts.join("; ");
}

export async function getMeServer(): Promise<ApiAuthMe | null> {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore);
  if (!cookieHeader) return null;

  try {
    const session = await httpClient<ApiAuthMe>("/api/v1/auth/me", {
      headers: { cookie: cookieHeader },
    });
    return session.isActive ? session : null;
  } catch {
    return null;
  }
}

export async function requireRole(role: Role): Promise<ApiAuthMe> {
  const session = await getMeServer();
  const sessionRole = session ? toDashboardRole(session.role) : null;
  if (!session || !sessionRole || sessionRole !== role) {
    redirect(ROUTES.login);
  }
  return session;
}
