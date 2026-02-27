import type { components } from "@/lib/http/openapi";

export type SellerStoreSummary = components["schemas"]["AuthStoreSummaryDto"];

export type Store = components["schemas"]["StoreDto"];
export type StoreListItem = components["schemas"]["StoreListItemDto"];
export type StoreDetail = components["schemas"]["StoreDetailDto"];

export type CreateStoreInput = components["schemas"]["CreateStoreDto"];
export type UpdateStoreInput = components["schemas"]["UpdateStoreDto"];
