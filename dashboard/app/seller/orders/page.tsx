"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { formatMinorUnits } from "@/lib/utils/money";
import { useRequiredStoreId } from "@/features/auth/useRequiredStoreId";
import { listOrders } from "@/features/seller/orders/orders.api";
import type { Order, OrderStatus } from "@/features/seller/orders/orders.types";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusOptions: Array<{ label: string; value: OrderStatus | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Pending payment", value: "PENDING_PAYMENT" },
  { label: "Paid", value: "PAID" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function SellerOrdersPage() {
  const storeId = useRequiredStoreId();
  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");

  const ordersQuery = useQuery({
    queryKey: ["seller", "orders", storeId, status],
    queryFn: () =>
      listOrders(storeId, status === "ALL" ? undefined : { status }),
    enabled: Boolean(storeId),
  });

  const orders = ordersQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Store-scoped orders for the selected store.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="w-56">
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {ordersQuery.isLoading ? <LoadingSkeleton lines={6} /> : null}
      {ordersQuery.isError ? (
        <ErrorState title="Failed to load orders" message="Please try again." />
      ) : null}

      {ordersQuery.isSuccess && orders.length === 0 ? (
        <EmptyState title="No orders" description="No orders match the current filters." />
      ) : null}

      {ordersQuery.isSuccess && orders.length > 0 ? (
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
            {
              header: "Status",
              cell: (o) => <Badge variant="secondary">{o.status}</Badge>,
            },
            {
              header: "Payment",
              cell: (o) => <Badge variant="outline">{o.paymentStatus}</Badge>,
            },
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
