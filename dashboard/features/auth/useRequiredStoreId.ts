"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/lib/constants/routes";
import { useAuthStore } from "@/features/auth/auth.store";

function readCookie(name: string): string | null {
  const encoded = encodeURIComponent(name) + "=";
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith(encoded)) {
      return decodeURIComponent(part.slice(encoded.length));
    }
  }
  return null;
}

export function useRequiredStoreId(): string {
  const router = useRouter();
  const activeStoreId = useAuthStore((s) => s.activeStoreId);
  const setActiveStoreId = useAuthStore((s) => s.setActiveStoreId);

  React.useEffect(() => {
    if (activeStoreId) return;

    const fromCookie = readCookie("ttpu_store_id");
    if (fromCookie) {
      setActiveStoreId(fromCookie);
      return;
    }

    router.push(ROUTES.seller.storeSwitch);
  }, [activeStoreId, router, setActiveStoreId]);

  return activeStoreId ?? "";
}

