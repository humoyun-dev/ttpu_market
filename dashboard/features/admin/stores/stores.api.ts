import { env } from "@/lib/env/env";
import { httpClient } from "@/lib/http/client";
import type { AdminStore } from "@/features/admin/stores/stores.types";
import {
  mockGetStore,
  mockListStores,
  mockSetStoreStatus,
} from "@/features/admin/stores/mocks";

export async function listStores(): Promise<AdminStore[]> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockListStores();
  }
  return await httpClient<AdminStore[]>("/admin/stores");
}

export async function getStore(storeId: string): Promise<AdminStore | null> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockGetStore(storeId);
  }
  return await httpClient<AdminStore>(`/admin/stores/${storeId}`);
}

export async function setStoreStatus(
  storeId: string,
  status: AdminStore["status"]
): Promise<AdminStore> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockSetStoreStatus(storeId, status);
  }
  return await httpClient<AdminStore>(`/admin/stores/${storeId}/status`, {
    method: "PATCH",
    body: { status },
  });
}

