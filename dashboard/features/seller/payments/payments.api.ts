import { httpClient } from "@/lib/http/client";
import type {
  PaymentSettings,
  UpdatePaymentSettingsInput,
} from "@/features/seller/payments/payments.types";

export async function getPaymentSettings(
  storeId: string,
  provider: string
): Promise<PaymentSettings> {
  // BACKEND TASK: add OpenAPI response schema for `GET /api/v1/stores/:storeId/payments/settings/:provider`
  // and document allowed provider enum values (PAYME/CLICK/CASH).
  return await httpClient<PaymentSettings>(
    `/api/v1/stores/${storeId}/payments/settings/${encodeURIComponent(provider)}`
  );
}

export async function updatePaymentSettings(
  storeId: string,
  provider: string,
  input: UpdatePaymentSettingsInput
): Promise<PaymentSettings> {
  // BACKEND TASK: add OpenAPI response schema for `PUT /api/v1/stores/:storeId/payments/settings/:provider`.
  return await httpClient<PaymentSettings>(`/api/v1/stores/${storeId}/payments/settings/${encodeURIComponent(provider)}`, {
    method: "PUT",
    body: input,
  });
}
