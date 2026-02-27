"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSeller, setSellerActive } from "@/features/admin/sellers/sellers.api";
import { listStores } from "@/features/admin/stores/stores.api";
import type { AdminStore } from "@/features/admin/stores/stores.types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSellerDetailPage() {
  const params = useParams();
  const sellerId = String(params.sellerId ?? "");
  const queryClient = useQueryClient();

  const sellerQuery = useQuery({
    queryKey: ["admin", "seller", sellerId],
    queryFn: () => getSeller(sellerId),
    enabled: Boolean(sellerId),
  });

  const storesQuery = useQuery({
    queryKey: ["admin", "stores", "bySeller", sellerId],
    queryFn: async () => (await listStores()).filter((s) => s.sellerId === sellerId),
    enabled: Boolean(sellerId),
  });

  const toggleMutation = useMutation({
    mutationFn: async (active: boolean) => setSellerActive(sellerId, active),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "sellers"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "seller", sellerId] });
    },
  });

  const seller = sellerQuery.data ?? null;
  const stores = storesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Seller</h1>
          <p className="text-sm text-muted-foreground">{sellerId}</p>
        </div>
        {seller ? (
          <ConfirmDialog
            title={seller.isActive ? "Disable seller?" : "Enable seller?"}
            description="Admin actions must be confirmed and audited server-side."
            confirmText={seller.isActive ? "Disable" : "Enable"}
            onConfirm={async () => {
              await toggleMutation.mutateAsync(!seller.isActive);
            }}
          >
            <Button
              variant={seller.isActive ? "destructive" : "default"}
              disabled={toggleMutation.isPending}
            >
              {seller.isActive ? "Disable" : "Enable"}
            </Button>
          </ConfirmDialog>
        ) : null}
      </div>

      {sellerQuery.isLoading ? <LoadingSkeleton lines={6} /> : null}
      {sellerQuery.isError ? (
        <ErrorState title="Failed to load seller" message="Please try again." />
      ) : null}
      {sellerQuery.isSuccess && !seller ? (
        <ErrorState title="Not found" message="Seller does not exist." />
      ) : null}

      {seller ? (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{seller.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{seller.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={seller.isActive ? "default" : "secondary"}>
                {seller.isActive ? "Active" : "Disabled"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Stores</CardTitle>
        </CardHeader>
        <CardContent>
          {storesQuery.isLoading ? <LoadingSkeleton lines={4} /> : null}
          {storesQuery.isError ? (
            <ErrorState title="Failed to load stores" message="Please try again." />
          ) : null}
          {storesQuery.isSuccess ? (
            <DataTable<AdminStore>
              columns={[
                { header: "Store", cell: (s) => s.name },
                { header: "Slug", cell: (s) => s.slug },
                { header: "Status", cell: (s) => <Badge variant="secondary">{s.status}</Badge> },
              ]}
              data={stores}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
