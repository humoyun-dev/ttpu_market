import type {
  ListOrdersParams,
  Order,
  OrderStatus,
} from "@/features/seller/orders/orders.types";

function nowIso() {
  return new Date().toISOString();
}

function history(...statuses: OrderStatus[]) {
  const base = Date.now();
  return statuses.map((s, idx) => ({
    status: s,
    at: new Date(base - (statuses.length - idx) * 60_000).toISOString(),
  }));
}

let orders: Order[] = [
  {
    id: "ord_1",
    storeId: "store_1",
    customerName: "Alice",
    status: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
    paymentProvider: "CLICK",
    subtotalMinor: "249900",
    discountMinor: "0",
    deliveryFeeMinor: "15000",
    totalMinor: "264900",
    currency: "UZS",
    createdAt: nowIso(),
    items: [
      {
        id: "item_1",
        productName: "Demo Product A",
        quantity: 1,
        priceMinor: "199900",
        currency: "UZS",
      },
      {
        id: "item_2",
        productName: "Demo Product B",
        quantity: 1,
        priceMinor: "50000",
        currency: "UZS",
      },
    ],
    statusHistory: history("DRAFT", "PENDING_PAYMENT"),
    allowedNextStatuses: ["CANCELLED"],
  },
  {
    id: "ord_2",
    storeId: "store_1",
    customerName: "Bob",
    status: "PROCESSING",
    paymentStatus: "PAID",
    paymentProvider: "PAYME",
    subtotalMinor: "49900",
    discountMinor: "0",
    deliveryFeeMinor: "0",
    totalMinor: "49900",
    currency: "UZS",
    createdAt: nowIso(),
    items: [
      {
        id: "item_3",
        productName: "Demo Product B",
        quantity: 1,
        priceMinor: "49900",
        currency: "UZS",
      },
    ],
    statusHistory: history("DRAFT", "PENDING_PAYMENT", "PAID", "PROCESSING"),
    allowedNextStatuses: ["READY", "CANCELLED"],
  },
  {
    id: "ord_3",
    storeId: "store_2",
    customerName: "Carol",
    status: "DELIVERED",
    paymentStatus: "PAID",
    paymentProvider: "CASH",
    subtotalMinor: "9900",
    discountMinor: "0",
    deliveryFeeMinor: "0",
    totalMinor: "9900",
    currency: "UZS",
    createdAt: nowIso(),
    items: [
      {
        id: "item_4",
        productName: "Store 2 Product",
        quantity: 1,
        priceMinor: "9900",
        currency: "UZS",
      },
    ],
    statusHistory: history(
      "DRAFT",
      "PENDING_PAYMENT",
      "PAID",
      "PROCESSING",
      "READY",
      "SHIPPED",
      "DELIVERED"
    ),
    allowedNextStatuses: [],
  },
];

export function mockListOrders(storeId: string, params?: ListOrdersParams): Order[] {
  return orders
    .filter((o) => o.storeId === storeId)
    .filter((o) => (params?.status ? o.status === params.status : true))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function mockGetOrder(storeId: string, orderId: string): Order | null {
  return orders.find((o) => o.storeId === storeId && o.id === orderId) ?? null;
}

export function mockUpdateOrderStatus(
  storeId: string,
  orderId: string,
  status: OrderStatus
): Order {
  const existing = mockGetOrder(storeId, orderId);
  if (!existing) throw new Error("Order not found");
  if (!existing.allowedNextStatuses.includes(status)) {
    throw new Error("Illegal status transition");
  }
  const updated: Order = {
    ...existing,
    status,
    statusHistory: [...existing.statusHistory, { status, at: nowIso() }],
    allowedNextStatuses: [],
  };
  orders = orders.map((o) => (o.id === orderId ? updated : o));
  return updated;
}

