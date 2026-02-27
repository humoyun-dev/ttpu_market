import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug is required")
  .max(50, "Slug is too long")
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens");

export const storeFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  slug: slugSchema,
  description: z.string().trim().max(500).optional(),
  logoUrl: z.string().trim().url("Invalid URL").optional().or(z.literal("")),
  supportedLanguages: z.array(z.string().trim().min(1)).min(1),
  defaultLanguage: z.string().trim().min(1),
  currency: z.string().trim().min(1),
  timezone: z.string().trim().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

export type StoreFormValues = z.infer<typeof storeFormSchema>;

