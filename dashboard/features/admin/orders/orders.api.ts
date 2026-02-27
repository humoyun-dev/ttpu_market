import type { AdminOrder } from "@/features/admin/orders/orders.types";

export async function listAdminOrders(): Promise<AdminOrder[]> {
  // BACKEND TASK: implement `GET /api/v1/admin/orders` and document response schema in OpenAPI.
  throw new Error(`BACKEND TASK: Admin orders endpoints are not implemented.`);
}

export async function getAdminOrder(orderId: string): Promise<AdminOrder | null> {
  // BACKEND TASK: implement `GET /api/v1/admin/orders/:orderId` and document response schema in OpenAPI.
  throw new Error(
    `BACKEND TASK: Admin orders endpoints are not implemented (requested orderId=${orderId}).`
  );
}
