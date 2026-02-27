"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { ROUTES } from "@/lib/constants/routes";
import { getMe } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";

const STORE_COOKIE = "ttpu_store_id";

function setCookie(name: string, value: string) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; Path=/; SameSite=Lax`;
}

export function StoreSwitchPage() {
  const router = useRouter();
  const setActiveStoreId = useAuthStore((s) => s.setActiveStoreId);

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
  });

  if (meQuery.isLoading) {
    return <LoadingSkeleton lines={5} />;
  }

  if (meQuery.isError) {
    return (
      <ErrorState
        title="Error"
        message="Failed to load stores. Please try again."
      />
    );
  }

  if (!meQuery.data) {
    return <ErrorState title="Error" message="Failed to load stores." />;
  }

  const stores = meQuery.data.stores ?? [];
  if (stores.length === 0) {
    return (
      <EmptyState
        title="No stores"
        description="Your account doesn't have any stores yet."
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Switch Store</h1>

      <div className="grid gap-4">
        {stores.map((store) => (
          <Card key={store.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{store.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Status: {store.status}
              </div>
              <Button
                onClick={() => {
                  setCookie(STORE_COOKIE, store.id);
                  setActiveStoreId(store.id);
                  router.push(ROUTES.seller.dashboard);
                }}
              >
                Select
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
