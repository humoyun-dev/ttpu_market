import type { AdminMetrics } from "@/features/admin/metrics/metrics.types";
import { mockListAdminOrders } from "@/features/admin/orders/mocks";
import { mockListSellers } from "@/features/admin/sellers/mocks";
import { mockListStores } from "@/features/admin/stores/mocks";

function sumMinorUnits(values: string[]): string {
  const total = values.reduce((acc, v) => acc + BigInt(v), BigInt(0));
  return total.toString();
}

export function mockGetAdminMetrics(): AdminMetrics {
  const sellers = mockListSellers();
  const stores = mockListStores();
  const orders = mockListAdminOrders();

  return {
    sellersTotal: sellers.length,
    storesTotal: stores.length,
    ordersTotal: orders.length,
    gmvMinor: sumMinorUnits(orders.map((o) => o.totalMinor)),
    webhookInvalidSecretTotal: 0,
    paymentInvalidSignatureTotal: 0,
    paymentSuccessTotal: orders.filter((o) => o.paymentStatus === "PAID").length,
  };
}

