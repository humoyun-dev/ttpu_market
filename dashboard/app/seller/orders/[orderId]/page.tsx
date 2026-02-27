"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { formatMinorUnits } from "@/lib/utils/money";
import { useRequiredStoreId } from "@/features/auth/useRequiredStoreId";
import { getOrder, updateOrderStatus } from "@/features/seller/orders/orders.api";
import type { OrderStatus } from "@/features/seller/orders/orders.types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/DataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SellerOrderDetailPage() {
  const params = useParams();
  const orderId = String(params.orderId ?? "");
  const storeId = useRequiredStoreId();
  const queryClient = useQueryClient();

  const orderQuery = useQuery({
    queryKey: ["seller", "order", storeId, orderId],
    queryFn: () => getOrder(storeId, orderId),
    enabled: Boolean(storeId && orderId),
  });

  const order = orderQuery.data ?? null;
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");

  const statusOptions = useMemo(() => order?.allowedNextStatuses ?? [], [order?.allowedNextStatuses]);

  const updateMutation = useMutation({
    mutationFn: async (status: OrderStatus) => updateOrderStatus(storeId, orderId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["seller", "orders", storeId] });
      await queryClient.invalidateQueries({ queryKey: ["seller", "order", storeId, orderId] });
      setNextStatus("");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
          <p className="text-sm text-muted-foreground">{orderId}</p>
        </div>
        {order && statusOptions.length > 0 ? (
          <div className="flex items-center gap-2">
            <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as OrderStatus)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ConfirmDialog
              title="Confirm status update?"
              description="Order status transitions are validated by backend policy."
              confirmText="Update"
              onConfirm={async () => {
                if (!nextStatus) return;
                await updateMutation.mutateAsync(nextStatus);
              }}
            >
              <Button disabled={!nextStatus || updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Apply"}
              </Button>
            </ConfirmDialog>
          </div>
        ) : null}
      </div>

      {orderQuery.isLoading ? <LoadingSkeleton lines={8} /> : null}
      {orderQuery.isError ? <ErrorState title="Failed to load order" message="Please try again." /> : null}
      {orderQuery.isSuccess && !order ? <ErrorState title="Not found" message="Order does not exist." /> : null}

      {order ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{order.status}</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <Badge variant="outline">{order.paymentStatus}</Badge>
                <div className="text-xs text-muted-foreground">
                  Provider: {order.paymentProvider}
                </div>
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

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { header: "Product", cell: (i) => i.productName },
                  { header: "Qty", cell: (i) => i.quantity.toString(), className: "text-right" },
                  {
                    header: "Price",
                    cell: (i) => formatMinorUnits(i.priceMinor, { currency: i.currency, decimals: 2 }),
                    className: "text-right",
                  },
                ]}
                data={order.items.map((it) => ({ ...it, id: it.id }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.statusHistory.map((e) => (
                <div key={e.at} className="flex items-center justify-between text-sm">
                  <span>{e.status}</span>
                  <span className="text-muted-foreground">{new Date(e.at).toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
