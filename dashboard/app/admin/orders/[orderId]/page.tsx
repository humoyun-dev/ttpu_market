"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { formatMinorUnits } from "@/lib/utils/money";
import { getAdminOrder } from "@/features/admin/orders/orders.api";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = String(params.orderId ?? "");

  const orderQuery = useQuery({
    queryKey: ["admin", "order", orderId],
    queryFn: () => getAdminOrder(orderId),
    enabled: Boolean(orderId),
  });

  const order = orderQuery.data ?? null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Order</h1>

      {orderQuery.isLoading ? <LoadingSkeleton lines={8} /> : null}
      {orderQuery.isError ? (
        <ErrorState title="Failed to load order" message="Please try again." />
      ) : null}
      {orderQuery.isSuccess && !order ? (
        <ErrorState title="Not found" message="Order does not exist." />
      ) : null}

      {order ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Store</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="font-medium">{order.storeName}</div>
              <div className="text-muted-foreground">{order.storeId}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Badge variant="secondary">{order.status}</Badge>
              <Badge variant="outline">{order.paymentStatus}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent className="text-lg font-semibold">
              {formatMinorUnits(order.totalMinor, { currency: order.currency, decimals: 2 })}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
