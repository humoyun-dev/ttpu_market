import type { SellerStoreSummary } from "@/features/seller/stores/stores.types";

export function getActiveStores(stores: SellerStoreSummary[]): SellerStoreSummary[] {
  return stores.filter((s) => s.status === "ACTIVE");
}
