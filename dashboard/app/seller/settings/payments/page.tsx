"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useRequiredStoreId } from "@/features/auth/useRequiredStoreId";
import {
  getPaymentSettings,
  updatePaymentSettings,
} from "@/features/seller/payments/payments.api";
import { providerSchema } from "@/features/seller/payments/payments.schemas";
import type { ProviderSettings } from "@/features/seller/payments/payments.types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type ProviderFormValues = {
  merchantId: string;
  secretKey: string;
  strictMode: boolean;
};

function ProviderForm({
  storeId,
  providerKey,
  settings,
}: {
  storeId: string;
  providerKey: "payme" | "click";
  settings: ProviderSettings;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      merchantId: settings.merchantId,
      secretKey: "",
      strictMode: settings.strictMode,
    },
  });

  React.useEffect(() => {
    form.reset({
      merchantId: settings.merchantId,
      secretKey: "",
      strictMode: settings.strictMode,
    });
  }, [form, settings.merchantId, settings.strictMode]);

  const updateMutation = useMutation({
    mutationFn: async (values: ProviderFormValues) =>
      updatePaymentSettings(storeId, {
        [providerKey]: {
          merchantId: values.merchantId,
          secretKey: values.secretKey,
          strictMode: values.strictMode,
        },
      }),
    onSuccess: async () => {
      form.reset({ ...form.getValues(), secretKey: "" });
      await queryClient.invalidateQueries({
        queryKey: ["seller", "payments", "settings", storeId],
      });
    },
  });

  async function onSubmit(values: ProviderFormValues) {
    setError(null);
    try {
      await updateMutation.mutateAsync(values);
    } catch {
      form.reset({ ...values, secretKey: "" });
      setError("Failed to update settings.");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${providerKey}-merchantId`}>Merchant ID</Label>
        <Input id={`${providerKey}-merchantId`} {...form.register("merchantId")} />
        {form.formState.errors.merchantId ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.merchantId.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={`${providerKey}-secretKey`}>Secret key</Label>
          <span className="text-xs text-muted-foreground">
            Saved:{" "}
            {settings.secretKeyLast4 ? (
              <Badge variant="outline">•••• {settings.secretKeyLast4}</Badge>
            ) : (
              "—"
            )}
          </span>
        </div>
        <Input
          id={`${providerKey}-secretKey`}
          type="password"
          autoComplete="off"
          placeholder="Enter new secret (never shown again)"
          {...form.register("secretKey")}
        />
        {form.formState.errors.secretKey ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.secretKey.message}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-md border p-3">
        <div>
          <div className="text-sm font-medium">Strict mode</div>
          <div className="text-xs text-muted-foreground">
            Invalid signatures must be rejected server-side.
          </div>
        </div>
        <Controller
          control={form.control}
          name="strictMode"
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

      <ConfirmDialog
        title="Save payment settings?"
        description="Secrets are stored securely on the backend and will be masked after save."
        confirmText="Save"
        onConfirm={async () => {
          await form.handleSubmit(onSubmit)();
        }}
      >
        <Button type="button" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </ConfirmDialog>
    </form>
  );
}

export default function SellerPaymentsSettingsPage() {
  const storeId = useRequiredStoreId();

  const settingsQuery = useQuery({
    queryKey: ["seller", "payments", "settings", storeId],
    queryFn: () => getPaymentSettings(storeId),
    enabled: Boolean(storeId),
  });

  const settings = settingsQuery.data ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Payments Settings</h1>

      {settingsQuery.isLoading ? <LoadingSkeleton lines={6} /> : null}
      {settingsQuery.isError ? (
        <ErrorState title="Failed to load settings" message="Please try again." />
      ) : null}

      {settings ? (
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Payme</CardTitle>
            </CardHeader>
            <CardContent>
              <ProviderForm storeId={storeId} providerKey="payme" settings={settings.payme} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Click</CardTitle>
            </CardHeader>
            <CardContent>
              <ProviderForm storeId={storeId} providerKey="click" settings={settings.click} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
