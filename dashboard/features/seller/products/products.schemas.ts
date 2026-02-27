import { z } from "zod";

const moneyIntegerSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^\\d+$/, "Enter a whole-number amount");

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  price: moneyIntegerSchema,
  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
