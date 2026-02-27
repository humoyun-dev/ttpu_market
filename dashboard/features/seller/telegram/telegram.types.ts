export type TelegramStatus = {
  connected: boolean;
  webhookHealth: "OK" | "ERROR" | "UNKNOWN";
  lastUpdatedAt: string | null;
};

export type TelegramConnectInput = {
  token: string;
};

