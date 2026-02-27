"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { ROUTES } from "@/lib/constants/routes";
import { useRequiredStoreId } from "@/features/auth/useRequiredStoreId";
import { listCategories } from "@/features/seller/categories/categories.api";
import { createProduct } from "@/features/seller/products/products.api";
import { toCreateProductInput } from "@/features/seller/products/products.mappers";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/features/seller/products/products.schemas";
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
import { ErrorState } from "@/components/shared/ErrorState";

export function SellerNewProductPage() {
  const router = useRouter();
  const storeId = useRequiredStoreId();

  const categoriesQuery = useQuery({
    queryKey: ["seller", "categories", storeId],
    queryFn: () => listCategories(storeId),
    enabled: Boolean(storeId),
  });

  const createMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      createProduct(storeId, toCreateProductInput(values)),
    onSuccess: (product) => {
      router.push(`${ROUTES.seller.products}/${product.id}`);
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

  if (categoriesQuery.isError) {
    return (
      <ErrorState
        title="Failed to load categories"
        message="Please refresh and try again."
      />
    );
  }

  const categories = categoriesQuery.data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">New Product</h1>
          <p className="text-sm text-muted-foreground">
            Create a product under the active store.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={ROUTES.seller.products}>Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={form.handleSubmit(async (values) => {
              await createMutation.mutateAsync(values);
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
              <Input
                id="price"
                inputMode="numeric"
                placeholder="100000"
                {...form.register("price")}
              />
              {form.formState.errors.price ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.price.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockQty">Stock</Label>
              <Input
                id="stockQty"
                inputMode="numeric"
                {...form.register("stockQty")}
              />
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
              {form.formState.errors.categoryId ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.categoryId.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input
                id="sortOrder"
                inputMode="numeric"
                {...form.register("sortOrder")}
              />
              {form.formState.errors.sortOrder ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.sortOrder.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="imageUrls">Image URLs (one per line)</Label>
              <Textarea
                id="imageUrls"
                placeholder="https://example.com/image1.jpg"
                {...form.register("imageUrls")}
              />
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

            {createMutation.isError ? (
              <div className="md:col-span-2">
                <p className="text-sm text-destructive" role="alert">
                  Failed to create product. Please verify the fields and try again.
                </p>
              </div>
            ) : null}

            <div className="md:col-span-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create product"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

