"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { ROUTES } from "@/lib/constants/routes";
import { createStore, listStores } from "@/features/seller/stores/stores.api";
import { toCreateStoreInput } from "@/features/seller/stores/stores.mappers";
import {
  storeFormSchema,
  type StoreFormValues,
} from "@/features/seller/stores/stores.schemas";
import { useAuthStore } from "@/features/auth/auth.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";

const STORE_COOKIE = "ttpu_store_id";

function setCookie(name: string, value: string) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; Path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function SellerStoresPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeStoreId = useAuthStore((s) => s.activeStoreId);
  const setActiveStoreId = useAuthStore((s) => s.setActiveStoreId);

  const storesQuery = useQuery({
    queryKey: ["seller", "stores"],
    queryFn: listStores,
  });

  const createMutation = useMutation({
    mutationFn: createStore,
    onSuccess: async (store) => {
      await queryClient.invalidateQueries({ queryKey: ["seller", "stores"] });
      setCookie(STORE_COOKIE, store.id);
      setActiveStoreId(store.id);
      router.push(ROUTES.seller.dashboard);
    },
  });

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      logoUrl: "",
      supportedLanguages: ["uz", "ru"],
      defaultLanguage: "uz",
      currency: "UZS",
      timezone: "Asia/Tashkent",
      status: "ACTIVE",
    },
    mode: "onSubmit",
  });

  async function onSubmit(values: StoreFormValues) {
    await createMutation.mutateAsync(toCreateStoreInput(values));
  }

  if (storesQuery.isLoading) {
    return <LoadingSkeleton lines={6} />;
  }

  if (storesQuery.isError) {
    return (
      <ErrorState
        title="Failed to load stores"
        message="Please refresh and try again."
      />
    );
  }

  const stores = storesQuery.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Stores</h1>
        {activeStoreId ? (
          <div className="text-sm text-muted-foreground">
            Active store: <span className="font-medium">{activeStoreId}</span>{" "}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                deleteCookie(STORE_COOKIE);
                setActiveStoreId(null);
              }}
            >
              Clear
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No active store selected</div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create store</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" placeholder="my-store" {...form.register("slug")} />
              {form.formState.errors.slug ? (
                <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...form.register("description")} />
              {form.formState.errors.description ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input id="logoUrl" placeholder="https://..." {...form.register("logoUrl")} />
              {form.formState.errors.logoUrl ? (
                <p className="text-sm text-destructive">{form.formState.errors.logoUrl.message}</p>
              ) : null}
            </div>

            {createMutation.isError ? (
              <div className="md:col-span-2">
                <p className="text-sm text-destructive" role="alert">
                  Failed to create store. Please verify the fields (slug must be unique).
                </p>
              </div>
            ) : null}

            <div className="md:col-span-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create store"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {stores.length === 0 ? (
        <EmptyState
          title="No stores yet"
          description="Create your first store to start selling."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {stores.map((store) => {
            const isActive = activeStoreId === store.id;
            const selectable = store.status === "ACTIVE";
            return (
              <Card key={store.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{store.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={store.status === "ACTIVE" ? "default" : "secondary"}>
                        {store.status}
                      </Badge>
                      {isActive ? <Badge variant="outline">Active</Badge> : null}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Slug: {store.slug}</div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    Products: {store._count.products} • Orders: {store._count.orders}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/seller/stores/${store.id}`}>Manage</Link>
                    </Button>
                    <Button
                      size="sm"
                      disabled={!selectable}
                      onClick={() => {
                        setCookie(STORE_COOKIE, store.id);
                        setActiveStoreId(store.id);
                        router.push(ROUTES.seller.dashboard);
                      }}
                    >
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

