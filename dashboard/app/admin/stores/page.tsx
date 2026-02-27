"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listStores, setStoreStatus } from "@/features/admin/stores/stores.api";
import type { AdminStore } from "@/features/admin/stores/stores.types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminStoresPage() {
  const queryClient = useQueryClient();

  const storesQuery = useQuery({
    queryKey: ["admin", "stores"],
    queryFn: () => listStores(),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AdminStore["status"] }) =>
      setStoreStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "stores"] });
    },
  });

  const stores = storesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Stores</h1>

      {storesQuery.isLoading ? <LoadingSkeleton lines={6} /> : null}
      {storesQuery.isError ? (
        <ErrorState title="Failed to load stores" message="Please try again." />
      ) : null}

      {storesQuery.isSuccess && stores.length === 0 ? (
        <EmptyState title="No stores" description="No stores found." />
      ) : null}

      {storesQuery.isSuccess && stores.length > 0 ? (
        <DataTable<AdminStore>
          columns={[
            {
              header: "Store",
              cell: (s) => (
                <Link className="font-medium hover:underline" href={`/admin/stores/${s.id}`}>
                  {s.name}
                </Link>
              ),
            },
            { header: "Slug", cell: (s) => s.slug },
            { header: "Seller", cell: (s) => s.sellerId },
            { header: "Telegram", cell: (s) => (s.telegramConnected ? "Connected" : "Not connected") },
            { header: "Status", cell: (s) => <Badge variant="secondary">{s.status}</Badge> },
            {
              header: "",
              cell: (s) => (
                <div className="flex justify-end gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/admin/stores/${s.id}`}>View</Link>
                  </Button>
                  <ConfirmDialog
                    title={s.status === "ACTIVE" ? "Disable store?" : "Enable store?"}
                    description="Admin actions must be confirmed and audited server-side."
                    confirmText={s.status === "ACTIVE" ? "Disable" : "Enable"}
                    onConfirm={async () => {
                      await statusMutation.mutateAsync({
                        id: s.id,
                        status: s.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                      });
                    }}
                  >
                    <Button
                      variant={s.status === "ACTIVE" ? "destructive" : "default"}
                      size="sm"
                      disabled={statusMutation.isPending}
                    >
                      {s.status === "ACTIVE" ? "Disable" : "Enable"}
                    </Button>
                  </ConfirmDialog>
                </div>
              ),
            },
          ]}
          data={stores}
        />
      ) : null}
    </div>
  );
}
