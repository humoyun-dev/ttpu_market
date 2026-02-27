import { z } from "zod";

export const orderStatusSchema = z.enum([
  "DRAFT",
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "READY",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "PENDING",
  "CONFIRMED",
]);

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
});

export type UpdateOrderStatusValues = z.infer<typeof updateOrderStatusSchema>;

