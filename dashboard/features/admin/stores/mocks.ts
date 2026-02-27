import type { AdminStore } from "@/features/admin/stores/stores.types";

function nowIso() {
  return new Date().toISOString();
}

let stores: AdminStore[] = [
  {
    id: "store_1",
    sellerId: "seller_1",
    name: "Demo Store 1",
    slug: "demo-store-1",
    status: "ACTIVE",
    telegramConnected: true,
    createdAt: nowIso(),
  },
  {
    id: "store_2",
    sellerId: "seller_1",
    name: "Demo Store 2",
    slug: "demo-store-2",
    status: "ACTIVE",
    telegramConnected: false,
    createdAt: nowIso(),
  },
];

export function mockListStores(): AdminStore[] {
  return [...stores];
}

export function mockGetStore(storeId: string): AdminStore | null {
  return stores.find((s) => s.id === storeId) ?? null;
}

export function mockSetStoreStatus(
  storeId: string,
  status: AdminStore["status"]
): AdminStore {
  const existing = mockGetStore(storeId);
  if (!existing) throw new Error("Store not found");
  const updated: AdminStore = { ...existing, status };
  stores = stores.map((s) => (s.id === storeId ? updated : s));
  return updated;
}

