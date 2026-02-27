import type { TelegramStatus } from "@/features/seller/telegram/telegram.types";

function nowIso() {
  return new Date().toISOString();
}

const statusByStore: Record<string, TelegramStatus> = {
  store_1: { connected: true, webhookHealth: "OK", lastUpdatedAt: nowIso() },
  store_2: { connected: false, webhookHealth: "UNKNOWN", lastUpdatedAt: null },
};

export function mockGetTelegramStatus(storeId: string): TelegramStatus {
  return (
    statusByStore[storeId] ?? {
      connected: false,
      webhookHealth: "UNKNOWN",
      lastUpdatedAt: null,
    }
  );
}

export function mockConnectTelegram(storeId: string) {
  statusByStore[storeId] = {
    connected: true,
    webhookHealth: "OK",
    lastUpdatedAt: nowIso(),
  };
}

export function mockDisconnectTelegram(storeId: string) {
  statusByStore[storeId] = {
    connected: false,
    webhookHealth: "UNKNOWN",
    lastUpdatedAt: nowIso(),
  };
}

