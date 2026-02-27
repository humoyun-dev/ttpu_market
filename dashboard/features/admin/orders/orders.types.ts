import type {
  Order,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
} from "@/features/seller/orders/orders.types";

export type AdminOrder = Order & {
  sellerId: string;
  storeName: string;
  paymentProvider: PaymentProvider;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
};

