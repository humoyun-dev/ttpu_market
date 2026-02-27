"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { formatMinorUnits } from "@/lib/utils/money";
import { listAdminOrders } from "@/features/admin/orders/orders.api";
import type { AdminOrder } from "@/features/admin/orders/orders.types";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";

export default function AdminOrdersPage() {
  const ordersQuery = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => listAdminOrders(),
  });

  const orders = ordersQuery.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>

      {ordersQuery.isLoading ? <LoadingSkeleton lines={6} /> : null}
      {ordersQuery.isError ? (
        <ErrorState title="Failed to load orders" message="Please try again." />
      ) : null}

      {ordersQuery.isSuccess && orders.length === 0 ? (
        <EmptyState title="No orders" description="No orders found." />
      ) : null}

      {ordersQuery.isSuccess && orders.length > 0 ? (
        <DataTable<AdminOrder>
          columns={[
            {
              header: "Order",
              cell: (o) => (
                <Link className="font-medium hover:underline" href={`/admin/orders/${o.id}`}>
                  {o.id}
                </Link>
              ),
            },
            { header: "Store", cell: (o) => o.storeName },
            { header: "Status", cell: (o) => <Badge variant="secondary">{o.status}</Badge> },
            { header: "Payment", cell: (o) => <Badge variant="outline">{o.paymentStatus}</Badge> },
            {
              header: "Total",
              className: "text-right",
              cell: (o) => formatMinorUnits(o.totalMinor, { currency: o.currency, decimals: 2 }),
            },
          ]}
          data={orders}
        />
      ) : null}
    </div>
  );
}
