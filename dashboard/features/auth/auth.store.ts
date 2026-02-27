"use client";

import { create } from "zustand";

type AuthUiState = {
  activeStoreId: string | null;
  setActiveStoreId: (storeId: string | null) => void;
};

export const useAuthStore = create<AuthUiState>((set) => ({
  activeStoreId: null,
  setActiveStoreId: (activeStoreId) => set({ activeStoreId }),
}));

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

export function hydrateAuthFromCookies() {
  const storeId = readCookie("ttpu_store_id");

  useAuthStore.setState({
    activeStoreId: storeId,
  });
}
