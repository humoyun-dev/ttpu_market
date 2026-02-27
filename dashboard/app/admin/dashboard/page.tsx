"use client";

import { useQuery } from "@tanstack/react-query";

import { formatMinorUnits } from "@/lib/utils/money";
import { getAdminMetrics } from "@/features/admin/metrics/metrics.api";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { MetricCard } from "@/components/shared/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  const metricsQuery = useQuery({
    queryKey: ["admin", "metrics", "overview"],
    queryFn: () => getAdminMetrics(),
  });

  const m = metricsQuery.data ?? null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>

      {metricsQuery.isLoading ? <LoadingSkeleton lines={6} /> : null}
      {metricsQuery.isError ? (
        <ErrorState title="Failed to load metrics" message="Please try again." />
      ) : null}

      {m ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Sellers" value={m.sellersTotal.toString()} />
            <MetricCard title="Stores" value={m.storesTotal.toString()} />
            <MetricCard title="Orders" value={m.ordersTotal.toString()} />
            <MetricCard
              title="GMV"
              value={formatMinorUnits(m.gmvMinor, { currency: "UZS", decimals: 2 })}
              hint="Minor units"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Security signals</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                title="Invalid webhook secrets"
                value={m.webhookInvalidSecretTotal.toString()}
              />
              <MetricCard
                title="Invalid payment signatures"
                value={m.paymentInvalidSignatureTotal.toString()}
              />
              <MetricCard
                title="Payment success"
                value={m.paymentSuccessTotal.toString()}
              />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
