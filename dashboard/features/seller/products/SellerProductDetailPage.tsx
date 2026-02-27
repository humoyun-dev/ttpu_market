"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { ROUTES } from "@/lib/constants/routes";
import { minorUnitsToDecimalString } from "@/lib/utils/money";
import { useRequiredStoreId } from "@/features/auth/useRequiredStoreId";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { listCategories } from "@/features/seller/categories/categories.api";
import { deleteProduct, getProduct, updateProduct } from "@/features/seller/products/products.api";
import { toUpdateProductInput } from "@/features/seller/products/products.mappers";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/features/seller/products/products.schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function toImageUrlsText(urls: Array<{ url: string }> | undefined): string {
  if (!urls || urls.length === 0) return "";
  return urls.map((i) => i.url).join("\n");
}

export function SellerProductDetailPage({ productId }: { productId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const storeId = useRequiredStoreId();

  const productQuery = useQuery({
    queryKey: ["seller", "products", storeId, productId],
    queryFn: () => getProduct(storeId, productId),
    enabled: Boolean(storeId) && Boolean(productId),
  });

  const categoriesQuery = useQuery({
    queryKey: ["seller", "categories", storeId],
    queryFn: () => listCategories(storeId),
    enabled: Boolean(storeId),
  });

  const updateMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      updateProduct(storeId, productId, toUpdateProductInput(values)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["seller", "products", storeId] }),
        queryClient.invalidateQueries({ queryKey: ["seller", "products", storeId, productId] }),
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(storeId, productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["seller", "products", storeId] });
      router.push(ROUTES.seller.products);
    },
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      stockQty: "0",
      sortOrder: "0",
      categoryId: "",
      imageUrls: "",
      isActive: true,
    },
    mode: "onSubmit",
  });

  React.useEffect(() => {
    if (!productQuery.data) return;
    const product = productQuery.data;
    form.reset({
      name: product.name ?? "",
      description: product.description ?? "",
      price: minorUnitsToDecimalString(product.price, { decimals: 0 }),
      stockQty: String(product.stockQty ?? 0),
      sortOrder: String(product.sortOrder ?? 0),
      categoryId: product.categoryId ?? "",
      imageUrls: toImageUrlsText(product.images),
      isActive: Boolean(product.isActive),
    });
  }, [productQuery.data, form]);

  if (productQuery.isLoading) {
    return <LoadingSkeleton lines={10} />;
  }

  if (productQuery.isError) {
    return (
      <ErrorState
        title="Failed to load product"
        message="Please refresh and try again."
      />
    );
  }

  if (!productQuery.data) {
    return <EmptyState title="Product not found" description="This product may not exist." />;
  }

  const product = productQuery.data;
  const categories = categoriesQuery.data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
            <Badge variant={product.isActive ? "default" : "secondary"}>
              {product.isActive ? "ACTIVE" : "INACTIVE"}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">Product ID: {product.id}</div>
        </div>
        <Button asChild variant="outline">
          <Link href={ROUTES.seller.products}>Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit product</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={form.handleSubmit(async (values) => {
              await updateMutation.mutateAsync(values);
            })}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...form.register("description")} />
              {form.formState.errors.description ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (UZS)</Label>
              <Input id="price" inputMode="numeric" {...form.register("price")} />
              {form.formState.errors.price ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.price.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockQty">Stock</Label>
              <Input id="stockQty" inputMode="numeric" {...form.register("stockQty")} />
              {form.formState.errors.stockQty ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.stockQty.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                value={form.watch("categoryId") ?? ""}
                onValueChange={(v) => form.setValue("categoryId", v)}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input id="sortOrder" inputMode="numeric" {...form.register("sortOrder")} />
              {form.formState.errors.sortOrder ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.sortOrder.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="imageUrls">Image URLs (one per line)</Label>
              <Textarea id="imageUrls" {...form.register("imageUrls")} />
              {form.formState.errors.imageUrls ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.imageUrls.message}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-md border p-3 md:col-span-2">
              <div>
                <div className="text-sm font-medium">Active</div>
                <div className="text-xs text-muted-foreground">
                  Inactive products are hidden from customers.
                </div>
              </div>
              <Switch
                checked={Boolean(form.watch("isActive"))}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
            </div>

            {updateMutation.isError ? (
              <div className="md:col-span-2">
                <p className="text-sm text-destructive" role="alert">
                  Failed to save. Please verify the fields and try again.
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 md:col-span-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
              <ConfirmDialog
                title="Delete product?"
                description="This action cannot be undone."
                confirmText="Delete"
                onConfirm={async () => {
                  await deleteMutation.mutateAsync();
                }}
              >
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteMutation.isPending || updateMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </ConfirmDialog>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

