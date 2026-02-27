import type { AdminOrder } from "@/features/admin/orders/orders.types";
import { mockListOrders } from "@/features/seller/orders/mocks";

export function mockListAdminOrders(): AdminOrder[] {
  const store1 = mockListOrders("store_1");
  const store2 = mockListOrders("store_2");

  const enrich = (o: (typeof store1)[number], storeName: string): AdminOrder => ({
    ...o,
    sellerId: "seller_1",
    storeName,
  });

  return [
    ...store1.map((o) => enrich(o, "Demo Store 1")),
    ...store2.map((o) => enrich(o, "Demo Store 2")),
  ];
}

export function mockGetAdminOrder(orderId: string): AdminOrder | null {
  return mockListAdminOrders().find((o) => o.id === orderId) ?? null;
}

