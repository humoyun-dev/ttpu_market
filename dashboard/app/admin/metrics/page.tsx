"use client";

import { useQuery } from "@tanstack/react-query";

import { formatMinorUnits } from "@/lib/utils/money";
import { getAdminMetrics } from "@/features/admin/metrics/metrics.api";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { MetricCard } from "@/components/shared/MetricCard";

export default function AdminMetricsPage() {
  const metricsQuery = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: () => getAdminMetrics(),
  });

  const m = metricsQuery.data ?? null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Metrics</h1>

      {metricsQuery.isLoading ? <LoadingSkeleton lines={6} /> : null}
      {metricsQuery.isError ? (
        <ErrorState title="Failed to load metrics" message="Please try again." />
      ) : null}

      {m ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Sellers" value={m.sellersTotal.toString()} />
          <MetricCard title="Stores" value={m.storesTotal.toString()} />
          <MetricCard title="Orders" value={m.ordersTotal.toString()} />
          <MetricCard
            title="GMV"
            value={formatMinorUnits(m.gmvMinor, { currency: "UZS", decimals: 2 })}
          />
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
        </div>
      ) : null}
    </div>
  );
}
