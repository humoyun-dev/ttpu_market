import type { SellerStore } from "@/features/seller/stores/stores.types";

export function getActiveStores(stores: SellerStore[]): SellerStore[] {
  return stores.filter((s) => s.status === "ACTIVE");
}

