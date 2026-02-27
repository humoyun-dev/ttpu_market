import { z } from "zod";

const moneyDecimalSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^\\d+(\\.\\d{1,2})?$/, "Enter a valid amount (max 2 decimals)");

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  price: moneyDecimalSchema,
  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
