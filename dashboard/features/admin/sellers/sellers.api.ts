import type { AdminSeller } from "@/features/admin/sellers/sellers.types";

export async function listSellers(): Promise<AdminSeller[]> {
  // BACKEND TASK: implement `GET /api/v1/admin/sellers` and document response schema in OpenAPI.
  throw new Error(`BACKEND TASK: Admin sellers endpoints are not implemented.`);
}

export async function getSeller(sellerId: string): Promise<AdminSeller | null> {
  // BACKEND TASK: implement `GET /api/v1/admin/sellers/:sellerId` and document response schema in OpenAPI.
  throw new Error(
    `BACKEND TASK: Admin sellers endpoints are not implemented (requested sellerId=${sellerId}).`
  );
}

export async function setSellerActive(
  sellerId: string,
  isActive: boolean
): Promise<AdminSeller> {
  // BACKEND TASK: implement `PATCH /api/v1/admin/sellers/:sellerId/status` and document in OpenAPI.
  throw new Error(
    `BACKEND TASK: Admin sellers endpoints are not implemented (requested sellerId=${sellerId}, isActive=${isActive}).`
  );
}
