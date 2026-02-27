"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useRequiredStoreId } from "@/features/auth/useRequiredStoreId";
import { getCustomer } from "@/features/seller/customers/customers.api";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SellerCustomerDetailPage() {
  const params = useParams();
  const customerId = String(params.customerId ?? "");
  const storeId = useRequiredStoreId();

  const customerQuery = useQuery({
    queryKey: ["seller", "customer", storeId, customerId],
    queryFn: () => getCustomer(storeId, customerId),
    enabled: Boolean(storeId && customerId),
  });

  const customer = customerQuery.data ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Customer</h1>

      {customerQuery.isLoading ? <LoadingSkeleton lines={6} /> : null}
      {customerQuery.isError ? (
        <ErrorState title="Failed to load customer" message="Please try again." />
      ) : null}
      {customerQuery.isSuccess && !customer ? (
        <ErrorState title="Not found" message="Customer does not exist." />
      ) : null}

      {customer ? (
        <Card>
          <CardHeader>
            <CardTitle>{customer.fullName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Telegram</span>
              <span>{customer.telegramId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{customer.phone ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(customer.createdAt).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
