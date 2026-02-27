import { z } from "zod";

export const providerSchema = z.object({
  merchantId: z.string().trim().min(1, "Merchant ID is required"),
  secretKey: z.string().trim().min(1, "Secret key is required"),
  strictMode: z.boolean(),
});

export const paymentSettingsFormSchema = z.object({
  payme: providerSchema.optional(),
  click: providerSchema.optional(),
});

export type PaymentSettingsFormValues = z.infer<typeof paymentSettingsFormSchema>;
