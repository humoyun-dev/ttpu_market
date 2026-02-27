import { httpClient } from "@/lib/http/client";
import type {
  ApiAuthMe,
  ApiAuthSession,
  ApiCsrfToken,
  ApiLoginInput,
} from "@/features/auth/auth.types";

export async function getCsrfToken(): Promise<ApiCsrfToken> {
  return await httpClient<ApiCsrfToken>("/api/v1/auth/csrf");
}

export async function login(input: ApiLoginInput): Promise<ApiAuthSession> {
  return await httpClient<ApiAuthSession>("/api/v1/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function logout(): Promise<void> {
  await httpClient<void>("/api/v1/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<ApiAuthMe> {
  return await httpClient<ApiAuthMe>("/api/v1/auth/me");
}
