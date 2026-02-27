import { env } from "@/lib/env/env";
import { httpClient } from "@/lib/http/client";
import type { AdminMetrics } from "@/features/admin/metrics/metrics.types";
import { mockGetAdminMetrics } from "@/features/admin/metrics/mocks";

export async function getAdminMetrics(): Promise<AdminMetrics> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockGetAdminMetrics();
  }
  return await httpClient<AdminMetrics>("/admin/metrics");
}

