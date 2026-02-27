import type { PaymentSettings } from "@/features/seller/payments/payments.types";

const settingsByStore: Record<string, PaymentSettings> = {
  store_1: {
    payme: { merchantId: "demo-payme", secretKeyLast4: "1234", strictMode: true },
    click: { merchantId: "demo-click", secretKeyLast4: "5678", strictMode: true },
  },
  store_2: {
    payme: { merchantId: "store2-payme", secretKeyLast4: null, strictMode: true },
    click: { merchantId: "store2-click", secretKeyLast4: null, strictMode: true },
  },
};

export function mockGetPaymentSettings(storeId: string): PaymentSettings {
  return (
    settingsByStore[storeId] ?? {
      payme: { merchantId: "", secretKeyLast4: null, strictMode: true },
      click: { merchantId: "", secretKeyLast4: null, strictMode: true },
    }
  );
}

export function mockUpdatePaymentSettings(
  storeId: string,
  input: {
    payme?: { merchantId: string; secretKey: string; strictMode: boolean };
    click?: { merchantId: string; secretKey: string; strictMode: boolean };
  }
): PaymentSettings {
  const prev = mockGetPaymentSettings(storeId);
  const next: PaymentSettings = {
    payme: input.payme
      ? {
          merchantId: input.payme.merchantId,
          secretKeyLast4: input.payme.secretKey.slice(-4),
          strictMode: input.payme.strictMode,
        }
      : prev.payme,
    click: input.click
      ? {
          merchantId: input.click.merchantId,
          secretKeyLast4: input.click.secretKey.slice(-4),
          strictMode: input.click.strictMode,
        }
      : prev.click,
  };
  settingsByStore[storeId] = next;
  return next;
}

