import type { components } from "@/lib/http/openapi";

export type OrderStatus = components["schemas"]["UpdateOrderStatusDto"]["status"];

export type Order = unknown;

export type ListOrdersParams = {
  status?: OrderStatus;
};
