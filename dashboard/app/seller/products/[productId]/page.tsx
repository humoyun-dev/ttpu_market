"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useRequiredStoreId } from "@/features/auth/useRequiredStoreId";
import { deleteProduct, getProduct, updateProduct } from "@/features/seller/products/products.api";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/features/seller/products/products.schemas";
import { toUpdateProductInput } from "@/features/seller/products/products.mappers";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { minorUnitsToDecimalString } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SellerProductDetailPage() {
  const params = useParams();
  const productId = String(params.productId ?? "");
  const router = useRouter();
  const storeId = useRequiredStoreId();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);

  const productQuery = useQuery({
    queryKey: ["seller", "product", storeId, productId],
    queryFn: () => getProduct(storeId, productId),
    enabled: Boolean(storeId && productId),
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { name: "", description: "", price: "", isActive: true },
  });

  React.useEffect(() => {
    const p = productQuery.data;
    if (!p) return;
    form.reset({
      name: p.name,
      description: p.description ?? "",
      price: minorUnitsToDecimalString(p.priceMinor, { decimals: 2 }),
      isActive: p.isActive,
    });
  }, [form, productQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (values: ProductFormValues) =>
      updateProduct(storeId, productId, toUpdateProductInput(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["seller", "products", storeId] });
      await queryClient.invalidateQueries({ queryKey: ["seller", "product", storeId, productId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => deleteProduct(storeId, productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["seller", "products", storeId] });
      router.push("/seller/products");
    },
  });

  async function onSubmit(values: ProductFormValues) {
    setError(null);
    try {
      await updateMutation.mutateAsync(values);
    } catch {
      setError("Failed to update product.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Product</h1>
        <ConfirmDialog
          title="Delete product?"
          description="This action cannot be undone."
          confirmText="Delete"
          onConfirm={async () => {
            await deleteMutation.mutateAsync();
          }}
        >
          <Button variant="destructive" disabled={deleteMutation.isPending}>
            Delete
          </Button>
        </ConfirmDialog>
      </div>

      {productQuery.isLoading ? <LoadingSkeleton lines={6} /> : null}
      {productQuery.isError ? (
        <ErrorState title="Failed to load product" message="Please try again." />
      ) : null}
      {productQuery.isSuccess && !productQuery.data ? (
        <ErrorState title="Not found" message="Product does not exist." />
      ) : null}

      {productQuery.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...form.register("description")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  inputMode="decimal"
                  placeholder="0.00"
                  {...form.register("price")}
                />
                {form.formState.errors.price ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.price.message}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Active</div>
                  <div className="text-xs text-muted-foreground">
                    Inactive products are hidden from customers.
                  </div>
                </div>
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
