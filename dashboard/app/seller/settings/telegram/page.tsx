"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useRequiredStoreId } from "@/features/auth/useRequiredStoreId";
import {
  connectTelegram,
  disconnectTelegram,
  getTelegramStatus,
} from "@/features/seller/telegram/telegram.api";
import {
  telegramConnectSchema,
  type TelegramConnectValues,
} from "@/features/seller/telegram/telegram.schemas";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SellerTelegramSettingsPage() {
  const storeId = useRequiredStoreId();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ["seller", "telegram", "status", storeId],
    queryFn: () => getTelegramStatus(storeId),
    enabled: Boolean(storeId),
  });

  const connectForm = useForm<TelegramConnectValues>({
    resolver: zodResolver(telegramConnectSchema),
    defaultValues: { token: "" },
  });

  const connectMutation = useMutation({
    mutationFn: async (values: TelegramConnectValues) =>
      connectTelegram(storeId, { token: values.token }),
    onSuccess: async () => {
      connectForm.reset({ token: "" });
      await queryClient.invalidateQueries({
        queryKey: ["seller", "telegram", "status", storeId],
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => disconnectTelegram(storeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["seller", "telegram", "status", storeId],
      });
    },
  });

  async function onConnect(values: TelegramConnectValues) {
    setError(null);
    try {
      await connectMutation.mutateAsync(values);
    } catch {
      connectForm.reset({ token: "" });
      setError("Failed to connect Telegram bot.");
    }
  }

  const status = statusQuery.data ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Telegram Settings</h1>

      {statusQuery.isLoading ? <LoadingSkeleton lines={6} /> : null}
      {statusQuery.isError ? (
        <ErrorState title="Failed to load status" message="Please try again." />
      ) : null}

      {status ? (
        <Card>
          <CardHeader>
            <CardTitle>Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge variant={status.connected ? "default" : "secondary"}>
                {status.connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Webhook health</div>
              <Badge variant="outline">{status.webhookHealth}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Last updated</div>
              <div className="text-sm">
                {status.lastUpdatedAt ? new Date(status.lastUpdatedAt).toLocaleString() : "—"}
              </div>
            </div>

            {!status.connected ? (
              <form onSubmit={connectForm.handleSubmit(onConnect)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Bot token</Label>
                  <Input
                    id="token"
                    type="password"
                    autoComplete="off"
                    placeholder="Paste token (never stored)"
                    {...connectForm.register("token")}
                  />
                  {connectForm.formState.errors.token ? (
                    <p className="text-sm text-destructive">
                      {connectForm.formState.errors.token.message}
                    </p>
                  ) : null}
                </div>

                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}

                <Button type="submit" disabled={connectMutation.isPending}>
                  {connectMutation.isPending ? "Connecting..." : "Connect"}
                </Button>
              </form>
            ) : (
              <ConfirmDialog
                title="Disconnect Telegram bot?"
                description="This will disable Telegram interactions for this store."
                confirmText="Disconnect"
                onConfirm={async () => {
                  await disconnectMutation.mutateAsync();
                }}
              >
                <Button variant="destructive" disabled={disconnectMutation.isPending}>
                  Disconnect
                </Button>
              </ConfirmDialog>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
