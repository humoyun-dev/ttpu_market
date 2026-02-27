"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { formatMinorUnits } from "@/lib/utils/money";
import { useRequiredStoreId } from "@/features/auth/useRequiredStoreId";
import { deleteProduct, listProducts } from "@/features/seller/products/products.api";
import type { Product } from "@/features/seller/products/products.types";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SellerProductsPage() {
  const storeId = useRequiredStoreId();
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["seller", "products", storeId],
    queryFn: () => listProducts(storeId),
    enabled: Boolean(storeId),
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => deleteProduct(storeId, productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["seller", "products", storeId] });
    },
  });

  const products = productsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <Button asChild>
          <Link href="/seller/products/new">New product</Link>
        </Button>
      </div>

      {productsQuery.isLoading ? <LoadingSkeleton lines={6} /> : null}
      {productsQuery.isError ? (
        <ErrorState title="Failed to load products" message="Please try again." />
      ) : null}

      {productsQuery.isSuccess && products.length === 0 ? (
        <EmptyState
          title="No products"
          description="Create your first product for the selected store."
        />
      ) : null}

      {productsQuery.isSuccess && products.length > 0 ? (
        <DataTable<Product>
          columns={[
            {
              header: "Name",
              cell: (p) => (
                <Link className="font-medium hover:underline" href={`/seller/products/${p.id}`}>
                  {p.name}
                </Link>
              ),
            },
            {
              header: "Price",
              cell: (p) => formatMinorUnits(p.priceMinor, { currency: p.currency, decimals: 2 }),
              className: "text-right",
            },
            {
              header: "Status",
              cell: (p) => (
                <Badge variant={p.isActive ? "default" : "secondary"}>
                  {p.isActive ? "Active" : "Inactive"}
                </Badge>
              ),
            },
            {
              header: "",
              cell: (p) => (
                <div className="flex justify-end gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/seller/products/${p.id}`}>Edit</Link>
                  </Button>
                  <ConfirmDialog
                    title="Delete product?"
                    description="This action cannot be undone."
                    confirmText="Delete"
                    onConfirm={async () => {
                      await deleteMutation.mutateAsync(p.id);
                    }}
                  >
                    <Button variant="destructive" size="sm" disabled={deleteMutation.isPending}>
                      Delete
                    </Button>
                  </ConfirmDialog>
                </div>
              ),
            },
          ]}
          data={products}
        />
      ) : null}
    </div>
  );
}
