import { httpClient } from "@/lib/http/client";
import type { ListOrdersParams, OrderStatus } from "@/features/seller/orders/orders.types";

export async function listOrders(
  storeId: string,
  params?: ListOrdersParams
): Promise<unknown> {
  // BACKEND TASK: add OpenAPI response schema for `GET /api/v1/stores/:storeId/orders`.

  const query = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
  return await httpClient<unknown>(`/api/v1/stores/${storeId}/orders${query}`);
}

export async function getOrder(storeId: string, orderId: string): Promise<unknown> {
  // BACKEND TASK: add OpenAPI response schema for `GET /api/v1/stores/:storeId/orders/:orderId`.
  return await httpClient<unknown>(`/api/v1/stores/${storeId}/orders/${orderId}`);
}

export async function updateOrderStatus(
  storeId: string,
  orderId: string,
  status: OrderStatus
): Promise<unknown> {
  // BACKEND TASK: add OpenAPI response schema for `PATCH /api/v1/stores/:storeId/orders/:orderId/status`.
  return await httpClient<unknown>(`/api/v1/stores/${storeId}/orders/${orderId}/status`, {
    method: "PATCH",
    body: { status },
  });
}
