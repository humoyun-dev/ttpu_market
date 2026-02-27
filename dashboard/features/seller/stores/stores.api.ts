import { getMe } from "@/features/auth/auth.api";
import type { SellerStore } from "@/features/seller/stores/stores.types";

export async function listSellerStores(): Promise<SellerStore[]> {
  const me = await getMe();
  return me.stores;
}
