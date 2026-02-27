"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { ROUTES } from "@/lib/constants/routes";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/features/auth/auth.store";
import { getStore, updateStore } from "@/features/seller/stores/stores.api";
import { toUpdateStoreInput } from "@/features/seller/stores/stores.mappers";
import {
  storeFormSchema,
  type StoreFormValues,
} from "@/features/seller/stores/stores.schemas";

const STORE_COOKIE = "ttpu_store_id";

function setCookie(name: string, value: string) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; Path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function SellerStoreDetailPage({ storeId }: { storeId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeStoreId = useAuthStore((s) => s.activeStoreId);
  const setActiveStoreId = useAuthStore((s) => s.setActiveStoreId);

  const storeQuery = useQuery({
    queryKey: ["seller", "stores", storeId],
    queryFn: () => getStore(storeId),
  });

  const updateMutation = useMutation({
    mutationFn: (values: StoreFormValues) =>
      updateStore(storeId, toUpdateStoreInput(values)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["seller", "stores"] }),
        queryClient.invalidateQueries({ queryKey: ["seller", "stores", storeId] }),
      ]);
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

  React.useEffect(() => {
    if (!storeQuery.data) return;
    const store = storeQuery.data;
    form.reset({
      name: store.name ?? "",
      slug: store.slug ?? "",
      description: store.description ?? "",
      logoUrl: store.logoUrl ?? "",
      supportedLanguages: store.supportedLanguages ?? ["uz", "ru"],
      defaultLanguage: store.defaultLanguage ?? "uz",
      currency: store.currency ?? "UZS",
      timezone: store.timezone ?? "Asia/Tashkent",
      status: store.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
    });
  }, [storeQuery.data, form]);

  if (storeQuery.isLoading) {
    return <LoadingSkeleton lines={8} />;
  }

  if (storeQuery.isError) {
    return (
      <ErrorState
        title="Failed to load store"
        message="Please refresh and try again."
      />
    );
  }

  if (!storeQuery.data) {
    return <EmptyState title="Store not found" description="This store may not exist." />;
  }

  const store = storeQuery.data;
  const isActive = activeStoreId === store.id;
  const selectable = store.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{store.name}</h1>
            <Badge variant={store.status === "ACTIVE" ? "default" : "secondary"}>
              {store.status}
            </Badge>
            {isActive ? <Badge variant="outline">Active</Badge> : null}
          </div>
          <div className="text-sm text-muted-foreground">Store ID: {store.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={ROUTES.seller.stores}>Back</Link>
          </Button>
          <Button
            disabled={!selectable}
            onClick={() => {
              setCookie(STORE_COOKIE, store.id);
              setActiveStoreId(store.id);
              router.push(ROUTES.seller.dashboard);
            }}
          >
            Select store
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store settings</CardTitle>
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
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...form.register("slug")} />
              {form.formState.errors.slug ? (
                <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch("status") ?? "ACTIVE"}
                onValueChange={(v) => form.setValue("status", v === "SUSPENDED" ? "SUSPENDED" : "ACTIVE")}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...form.register("description")} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input id="logoUrl" placeholder="https://..." {...form.register("logoUrl")} />
              {form.formState.errors.logoUrl ? (
                <p className="text-sm text-destructive">{form.formState.errors.logoUrl.message}</p>
              ) : null}
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
                title={store.status === "ACTIVE" ? "Suspend store?" : "Activate store?"}
                description="This changes store availability. Your active store selection will be cleared if the store becomes inactive."
                confirmText={store.status === "ACTIVE" ? "Suspend" : "Activate"}
                onConfirm={async () => {
                  const nextStatus = store.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
                  await updateMutation.mutateAsync({
                    ...form.getValues(),
                    status: nextStatus,
                  });
                  if (nextStatus !== "ACTIVE" && activeStoreId === store.id) {
                    setActiveStoreId(null);
                    deleteCookie(STORE_COOKIE);
                  }
                }}
              >
                <Button variant="destructive" type="button" disabled={updateMutation.isPending}>
                  {store.status === "ACTIVE" ? "Suspend" : "Activate"}
                </Button>
              </ConfirmDialog>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
