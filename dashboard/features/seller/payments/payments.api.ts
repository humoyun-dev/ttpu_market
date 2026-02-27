import { env } from "@/lib/env/env";
import { httpClient } from "@/lib/http/client";
import type {
  PaymentSettings,
  UpdatePaymentSettingsInput,
} from "@/features/seller/payments/payments.types";
import {
  mockGetPaymentSettings,
  mockUpdatePaymentSettings,
} from "@/features/seller/payments/mocks";

export async function getPaymentSettings(storeId: string): Promise<PaymentSettings> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockGetPaymentSettings(storeId);
  }
  return await httpClient<PaymentSettings>(`/stores/${storeId}/payment-settings`);
}

export async function updatePaymentSettings(
  storeId: string,
  input: UpdatePaymentSettingsInput
): Promise<PaymentSettings> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockUpdatePaymentSettings(storeId, input);
  }
  return await httpClient<PaymentSettings>(`/stores/${storeId}/payment-settings`, {
    method: "PUT",
    body: input,
  });
}

