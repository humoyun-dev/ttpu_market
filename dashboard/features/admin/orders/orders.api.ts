import { env } from "@/lib/env/env";
import { httpClient } from "@/lib/http/client";
import type { AdminOrder } from "@/features/admin/orders/orders.types";
import { mockGetAdminOrder, mockListAdminOrders } from "@/features/admin/orders/mocks";

export async function listAdminOrders(): Promise<AdminOrder[]> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockListAdminOrders();
  }
  return await httpClient<AdminOrder[]>("/admin/orders");
}

export async function getAdminOrder(orderId: string): Promise<AdminOrder | null> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockGetAdminOrder(orderId);
  }
  return await httpClient<AdminOrder>(`/admin/orders/${orderId}`);
}

