import { env } from "@/lib/env/env";
import { httpClient } from "@/lib/http/client";
import type { SellerStore } from "@/features/seller/stores/stores.types";
import { mockListSellerStores } from "@/features/seller/stores/mocks";

export async function listSellerStores(): Promise<SellerStore[]> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockListSellerStores();
  }

  return await httpClient<SellerStore[]>("/seller/stores");
}

