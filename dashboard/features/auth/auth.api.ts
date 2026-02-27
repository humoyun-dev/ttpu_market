import { env } from "@/lib/env/env";
import { httpClient } from "@/lib/http/client";
import type { AuthSession, LoginInput } from "@/features/auth/auth.types";
import { mockLogin, mockLogout } from "@/features/auth/mocks";

export async function login(input: LoginInput): Promise<AuthSession> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockLogin(input);
  }

  return await httpClient<AuthSession>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function logout(): Promise<void> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    mockLogout();
    return;
  }

  await httpClient<void>("/auth/logout", { method: "POST" });
}

