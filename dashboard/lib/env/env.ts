import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_USE_MOCKS: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((v) => v === "true"),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
});

export const env = publicEnvSchema.parse({
  NEXT_PUBLIC_USE_MOCKS: process.env.NEXT_PUBLIC_USE_MOCKS,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

