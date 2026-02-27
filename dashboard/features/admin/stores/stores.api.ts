import type { AdminStore } from "@/features/admin/stores/stores.types";

export async function listStores(): Promise<AdminStore[]> {
  // BACKEND TASK: implement `GET /api/v1/admin/stores` and document response schema in OpenAPI.
  throw new Error(`BACKEND TASK: Admin stores endpoints are not implemented.`);
}

export async function getStore(storeId: string): Promise<AdminStore | null> {
  // BACKEND TASK: implement `GET /api/v1/admin/stores/:storeId` and document response schema in OpenAPI.
  throw new Error(
    `BACKEND TASK: Admin stores endpoints are not implemented (requested storeId=${storeId}).`
  );
}

export async function setStoreStatus(
  storeId: string,
  status: string
): Promise<AdminStore> {
  // BACKEND TASK: implement `PATCH /api/v1/admin/stores/:storeId/status` and document in OpenAPI.
  throw new Error(
    `BACKEND TASK: Admin stores endpoints are not implemented (requested storeId=${storeId}, status=${status}).`
  );
}
