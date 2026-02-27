import { env } from "@/lib/env/env";
import { httpClient } from "@/lib/http/client";
import type {
  ListOrdersParams,
  Order,
  OrderStatus,
} from "@/features/seller/orders/orders.types";
import {
  mockGetOrder,
  mockListOrders,
  mockUpdateOrderStatus,
} from "@/features/seller/orders/mocks";

export async function listOrders(
  storeId: string,
  params?: ListOrdersParams
): Promise<Order[]> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockListOrders(storeId, params);
  }

  const query = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
  return await httpClient<Order[]>(`/stores/${storeId}/orders${query}`);
}

export async function getOrder(storeId: string, orderId: string): Promise<Order | null> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockGetOrder(storeId, orderId);
  }
  return await httpClient<Order>(`/stores/${storeId}/orders/${orderId}`);
}

export async function updateOrderStatus(
  storeId: string,
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockUpdateOrderStatus(storeId, orderId, status);
  }
  return await httpClient<Order>(`/stores/${storeId}/orders/${orderId}/status`, {
    method: "PATCH",
    body: { status },
  });
}

