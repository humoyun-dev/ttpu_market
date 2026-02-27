export type OrderStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "READY"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
  | "PENDING"
  | "CONFIRMED";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type PaymentProvider = "PAYME" | "CLICK" | "CASH";

export type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  priceMinor: string;
  currency: "UZS";
};

export type OrderStatusEvent = {
  status: OrderStatus;
  at: string;
};

export type Order = {
  id: string;
  storeId: string;
  customerName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentProvider: PaymentProvider;
  subtotalMinor: string;
  discountMinor: string;
  deliveryFeeMinor: string;
  totalMinor: string;
  currency: "UZS";
  createdAt: string;
  items: OrderItem[];
  statusHistory: OrderStatusEvent[];
  allowedNextStatuses: OrderStatus[];
};

export type ListOrdersParams = {
  status?: OrderStatus;
};

