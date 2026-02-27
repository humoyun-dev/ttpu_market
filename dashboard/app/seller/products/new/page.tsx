"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useRequiredStoreId } from "@/features/auth/useRequiredStoreId";
import { createProduct } from "@/features/seller/products/products.api";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/features/seller/products/products.schemas";
import { toCreateProductInput } from "@/features/seller/products/products.mappers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SellerNewProductPage() {
  const router = useRouter();
  const storeId = useRequiredStoreId();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { name: "", description: "", price: "", isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: async (values: ProductFormValues) =>
      createProduct(storeId, toCreateProductInput(values)),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["seller", "products", storeId] });
      router.push(`/seller/products/${created.id}`);
    },
  });

  async function onSubmit(values: ProductFormValues) {
    setError(null);
    try {
      await createMutation.mutateAsync(values);
    } catch {
      setError("Failed to create product.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New Product</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create product</CardTitle>
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
              <Input id="price" inputMode="decimal" placeholder="0.00" {...form.register("price")} />
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

            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
