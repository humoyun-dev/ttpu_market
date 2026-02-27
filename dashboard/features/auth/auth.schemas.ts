import { z } from "zod";

export const loginSchema = z.object({
  role: z.enum(["admin", "seller"]),
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginValues = z.infer<typeof loginSchema>;

