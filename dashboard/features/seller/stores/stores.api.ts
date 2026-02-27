import { httpClient } from "@/lib/http/client";
import type {
  CreateStoreInput,
  Store,
  StoreDetail,
  StoreListItem,
  UpdateStoreInput,
} from "@/features/seller/stores/stores.types";

export async function listStores(): Promise<StoreListItem[]> {
  return await httpClient<StoreListItem[]>("/api/v1/stores");
}

export async function createStore(input: CreateStoreInput): Promise<Store> {
  return await httpClient<Store>("/api/v1/stores", {
    method: "POST",
    body: input,
  });
}

export async function getStore(storeId: string): Promise<StoreDetail> {
  return await httpClient<StoreDetail>(`/api/v1/stores/${storeId}`);
}

export async function updateStore(
  storeId: string,
  input: UpdateStoreInput
): Promise<Store> {
  return await httpClient<Store>(`/api/v1/stores/${storeId}`, {
    method: "PATCH",
    body: input,
  });
}
