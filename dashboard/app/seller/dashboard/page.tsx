"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { formatMinorUnits } from "@/lib/utils/money";
import { useRequiredStoreId } from "@/features/auth/useRequiredStoreId";
import { listOrders } from "@/features/seller/orders/orders.api";
import type { Order } from "@/features/seller/orders/orders.types";
import { DataTable } from "@/components/shared/DataTable";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { MetricCard } from "@/components/shared/MetricCard";
import { Badge } from "@/components/ui/badge";

function sumMinorUnits(values: string[]): string {
  const total = values.reduce((acc, v) => acc + BigInt(v), BigInt(0));
  return total.toString();
}

export default function SellerDashboardPage() {
  const storeId = useRequiredStoreId();

  const ordersQuery = useQuery({
    queryKey: ["seller", "orders", "dashboard", storeId],
    queryFn: () => listOrders(storeId),
    enabled: Boolean(storeId),
  });

  const orders = ordersQuery.data ?? [];
  const revenueMinor = sumMinorUnits(
    orders.filter((o) => o.paymentStatus === "PAID").map((o) => o.totalMinor)
  );

  const pendingPaymentCount = orders.filter((o) => o.status === "PENDING_PAYMENT").length;
  const processingCount = orders.filter((o) => o.status === "PROCESSING").length;

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Seller Dashboard</h1>

      {ordersQuery.isLoading ? <LoadingSkeleton lines={6} /> : null}
      {ordersQuery.isError ? (
        <ErrorState title="Failed to load dashboard" message="Please try again." />
      ) : null}

      {ordersQuery.isSuccess ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Orders" value={orders.length.toString()} />
            <MetricCard
              title="Revenue"
              value={formatMinorUnits(revenueMinor, { currency: "UZS", decimals: 2 })}
              hint="Paid only"
            />
            <MetricCard title="Pending Payment" value={pendingPaymentCount.toString()} />
            <MetricCard title="Processing" value={processingCount.toString()} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Recent orders</h2>
              <Link className="text-sm text-primary hover:underline" href="/seller/orders">
                View all
              </Link>
            </div>
            <DataTable<Order>
              columns={[
                {
                  header: "Order",
                  cell: (o) => (
                    <Link className="font-medium hover:underline" href={`/seller/orders/${o.id}`}>
                      {o.id}
                    </Link>
                  ),
                },
                { header: "Customer", cell: (o) => o.customerName },
                { header: "Status", cell: (o) => <Badge variant="secondary">{o.status}</Badge> },
                {
                  header: "Total",
                  className: "text-right",
                  cell: (o) => formatMinorUnits(o.totalMinor, { currency: o.currency, decimals: 2 }),
                },
              ]}
              data={recentOrders}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
