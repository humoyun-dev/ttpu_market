"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getStore, setStoreStatus } from "@/features/admin/stores/stores.api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminStoreDetailPage() {
  const params = useParams();
  const storeId = String(params.storeId ?? "");
  const queryClient = useQueryClient();

  const storeQuery = useQuery({
    queryKey: ["admin", "store", storeId],
    queryFn: () => getStore(storeId),
    enabled: Boolean(storeId),
  });

  const statusMutation = useMutation({
    mutationFn: async (status: "ACTIVE" | "SUSPENDED") => setStoreStatus(storeId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "stores"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "store", storeId] });
    },
  });

  const store = storeQuery.data ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Store</h1>
          <p className="text-sm text-muted-foreground">{storeId}</p>
        </div>
        {store ? (
          <ConfirmDialog
            title={store.status === "ACTIVE" ? "Disable store?" : "Enable store?"}
            description="Admin actions must be confirmed and audited server-side."
            confirmText={store.status === "ACTIVE" ? "Disable" : "Enable"}
            onConfirm={async () => {
              await statusMutation.mutateAsync(
                store.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
              );
            }}
          >
            <Button
              variant={store.status === "ACTIVE" ? "destructive" : "default"}
              disabled={statusMutation.isPending}
            >
              {store.status === "ACTIVE" ? "Disable" : "Enable"}
            </Button>
          </ConfirmDialog>
        ) : null}
      </div>

      {storeQuery.isLoading ? <LoadingSkeleton lines={6} /> : null}
      {storeQuery.isError ? (
        <ErrorState title="Failed to load store" message="Please try again." />
      ) : null}
      {storeQuery.isSuccess && !store ? (
        <ErrorState title="Not found" message="Store does not exist." />
      ) : null}

      {store ? (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{store.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span>{store.slug}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Seller</span>
              <span>{store.sellerId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Telegram</span>
              <Badge variant={store.telegramConnected ? "default" : "secondary"}>
                {store.telegramConnected ? "Connected" : "Not connected"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="secondary">{store.status}</Badge>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
