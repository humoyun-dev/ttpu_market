export type ProviderSettings = {
  merchantId: string;
  secretKeyLast4: string | null;
  strictMode: boolean;
};

export type PaymentSettings = {
  payme: ProviderSettings;
  click: ProviderSettings;
};

export type UpdatePaymentSettingsInput = {
  payme?: { merchantId: string; secretKey: string; strictMode: boolean };
  click?: { merchantId: string; secretKey: string; strictMode: boolean };
};

