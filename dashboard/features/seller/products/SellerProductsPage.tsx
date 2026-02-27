"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { ROUTES } from "@/lib/constants/routes";
import { formatMinorUnits } from "@/lib/utils/money";
import { listProducts } from "@/features/seller/products/products.api";
import type { Product } from "@/features/seller/products/products.types";
import { useRequiredStoreId } from "@/features/auth/useRequiredStoreId";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

function matchesSearch(product: Product, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return product.name.toLowerCase().includes(q);
}

export function SellerProductsPage() {
  const storeId = useRequiredStoreId();
  const [search, setSearch] = React.useState("");

  const productsQuery = useQuery({
    queryKey: ["seller", "products", storeId],
    queryFn: () => listProducts(storeId),
    enabled: Boolean(storeId),
  });

  if (productsQuery.isLoading) {
    return <LoadingSkeleton lines={8} />;
  }

  if (productsQuery.isError) {
    return (
      <ErrorState
        title="Failed to load products"
        message="Please refresh and try again."
      />
    );
  }

  const products = (productsQuery.data ?? []).filter((p) => matchesSearch(p, search));

  const columns: Array<DataTableColumn<Product>> = [
    {
      header: "Name",
      cell: (row) => (
        <div className="space-y-1">
          <div className="font-medium">{row.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.category?.name ? `Category: ${row.category.name}` : "No category"}
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      className: "w-[160px]",
      cell: (row) => (
        <span className="font-mono text-sm">
          {formatMinorUnits(row.price, { currency: "UZS", decimals: 0 })}
        </span>
      ),
    },
    {
      header: "Stock",
      className: "w-[100px]",
      cell: (row) => <span className="text-sm">{row.stockQty}</span>,
    },
    {
      header: "Status",
      className: "w-[120px]",
      cell: (row) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? "ACTIVE" : "INACTIVE"}
        </Badge>
      ),
    },
    {
      header: "",
      className: "w-[120px] text-right",
      cell: (row) => (
        <Button asChild variant="outline" size="sm">
          <Link href={`${ROUTES.seller.products}/${row.id}`}>Edit</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Store-scoped catalog management.</p>
        </div>
        <Button asChild>
          <Link href={ROUTES.seller.newProduct}>New product</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="max-w-sm"
        />
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="No products"
          description="Create your first product to start receiving orders."
        />
      ) : (
        <DataTable columns={columns} data={products} />
      )}
    </div>
  );
}

