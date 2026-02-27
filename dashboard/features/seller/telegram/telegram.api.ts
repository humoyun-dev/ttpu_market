import { httpClient } from "@/lib/http/client";
import type {
  TelegramConnectInput,
  TelegramStatus,
} from "@/features/seller/telegram/telegram.types";

export async function getTelegramStatus(storeId: string): Promise<TelegramStatus> {
  // BACKEND TASK: add OpenAPI response schema for `GET /api/v1/stores/:storeId/telegram/bot`.
  return await httpClient<TelegramStatus>(`/api/v1/stores/${storeId}/telegram/bot`);
}

export async function connectTelegram(
  storeId: string,
  input: TelegramConnectInput
): Promise<void> {
  // BACKEND TASK: add OpenAPI response schema for `POST /api/v1/stores/:storeId/telegram/connect`.
  await httpClient<void>(`/api/v1/stores/${storeId}/telegram/connect`, {
    method: "POST",
    body: input,
  });
}

export async function disconnectTelegram(storeId: string): Promise<void> {
  // BACKEND TASK: implement a disconnect endpoint (e.g. `DELETE /api/v1/stores/:storeId/telegram/bot`)
  // and document it in OpenAPI. Dashboard will wire it once available.
  throw new Error(
    `BACKEND TASK: Telegram disconnect endpoint is not implemented (requested storeId=${storeId}).`
  );
}
