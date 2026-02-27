import type { SellerStore } from "@/features/seller/stores/stores.types";

export function mockListSellerStores(): SellerStore[] {
  return [
    { id: "store_1", name: "Demo Store 1", status: "ACTIVE" },
    { id: "store_2", name: "Demo Store 2", status: "ACTIVE" },
  ];
}

