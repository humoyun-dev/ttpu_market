import { env } from "@/lib/env/env";
import { httpClient } from "@/lib/http/client";
import type {
  TelegramConnectInput,
  TelegramStatus,
} from "@/features/seller/telegram/telegram.types";
import {
  mockConnectTelegram,
  mockDisconnectTelegram,
  mockGetTelegramStatus,
} from "@/features/seller/telegram/mocks";

export async function getTelegramStatus(storeId: string): Promise<TelegramStatus> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockGetTelegramStatus(storeId);
  }
  return await httpClient<TelegramStatus>(`/stores/${storeId}/telegram/status`);
}

export async function connectTelegram(
  storeId: string,
  input: TelegramConnectInput
): Promise<void> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    mockConnectTelegram(storeId);
    return;
  }
  await httpClient<void>(`/stores/${storeId}/telegram/connect`, {
    method: "POST",
    body: input,
  });
}

export async function disconnectTelegram(storeId: string): Promise<void> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    mockDisconnectTelegram(storeId);
    return;
  }
  await httpClient<void>(`/stores/${storeId}/telegram/disconnect`, {
    method: "POST",
  });
}

