"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/lib/constants/routes";
import { mockCookies } from "@/features/auth/mocks";
import { useAuthStore } from "@/features/auth/auth.store";
import { listSellerStores } from "@/features/seller/stores/stores.api";
import type { SellerStore } from "@/features/seller/stores/stores.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";

function setCookie(name: string, value: string) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; Path=/; SameSite=Lax`;
}

export default function SellerStoreSwitchPage() {
  const router = useRouter();
  const setActiveStoreId = useAuthStore((s) => s.setActiveStoreId);
  const [stores, setStores] = React.useState<SellerStore[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listSellerStores();
        if (mounted) setStores(data);
      } catch {
        if (mounted) setError("Failed to load stores.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Switch Store</h1>

      {error ? <ErrorState title="Error" message={error} /> : null}
      {!stores && !error ? <LoadingSkeleton lines={5} /> : null}

      {stores ? (
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
                    setCookie(mockCookies.STORE_COOKIE, store.id);
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
      ) : null}
    </div>
  );
}

