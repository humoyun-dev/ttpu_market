"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listSellers, setSellerActive } from "@/features/admin/sellers/sellers.api";
import type { AdminSeller } from "@/features/admin/sellers/sellers.types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminSellersPage() {
  const queryClient = useQueryClient();

  const sellersQuery = useQuery({
    queryKey: ["admin", "sellers"],
    queryFn: () => listSellers(),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) =>
      setSellerActive(id, active),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "sellers"] });
    },
  });

  const sellers = sellersQuery.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Sellers</h1>

      {sellersQuery.isLoading ? <LoadingSkeleton lines={6} /> : null}
      {sellersQuery.isError ? (
        <ErrorState title="Failed to load sellers" message="Please try again." />
      ) : null}

      {sellersQuery.isSuccess && sellers.length === 0 ? (
        <EmptyState title="No sellers" description="No sellers found." />
      ) : null}

      {sellersQuery.isSuccess && sellers.length > 0 ? (
        <DataTable<AdminSeller>
          columns={[
            {
              header: "Seller",
              cell: (s) => (
                <Link className="font-medium hover:underline" href={`/admin/sellers/${s.id}`}>
                  {s.fullName}
                </Link>
              ),
            },
            { header: "Email", cell: (s) => s.email },
            {
              header: "Status",
              cell: (s) => (
                <Badge variant={s.isActive ? "default" : "secondary"}>
                  {s.isActive ? "Active" : "Disabled"}
                </Badge>
              ),
            },
            {
              header: "Stores",
              className: "text-right",
              cell: (s) => s.storeCount.toString(),
            },
            {
              header: "",
              cell: (s) => (
                <div className="flex justify-end gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/admin/sellers/${s.id}`}>View</Link>
                  </Button>
                  <ConfirmDialog
                    title={s.isActive ? "Disable seller?" : "Enable seller?"}
                    description="Admin actions must be confirmed and audited server-side."
                    confirmText={s.isActive ? "Disable" : "Enable"}
                    onConfirm={async () => {
                      await toggleMutation.mutateAsync({ id: s.id, active: !s.isActive });
                    }}
                  >
                    <Button
                      variant={s.isActive ? "destructive" : "default"}
                      size="sm"
                      disabled={toggleMutation.isPending}
                    >
                      {s.isActive ? "Disable" : "Enable"}
                    </Button>
                  </ConfirmDialog>
                </div>
              ),
            },
          ]}
          data={sellers}
        />
      ) : null}
    </div>
  );
}
