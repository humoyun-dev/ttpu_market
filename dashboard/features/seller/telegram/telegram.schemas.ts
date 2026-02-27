import { z } from "zod";

export const telegramConnectSchema = z.object({
  token: z.string().min(1, "Bot token is required"),
});

export type TelegramConnectValues = z.infer<typeof telegramConnectSchema>;

