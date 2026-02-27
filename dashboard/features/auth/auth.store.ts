"use client";

import { create } from "zustand";

import type { Role } from "@/lib/constants/roles";

type AuthUiState = {
  role: Role | null;
  activeStoreId: string | null;
  setRole: (role: Role | null) => void;
  setActiveStoreId: (storeId: string | null) => void;
};

export const useAuthStore = create<AuthUiState>((set) => ({
  role: null,
  activeStoreId: null,
  setRole: (role) => set({ role }),
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
  const role = readCookie("ttpu_role");
  const storeId = readCookie("ttpu_store_id");

  useAuthStore.setState({
    role: role === "admin" || role === "seller" ? role : null,
    activeStoreId: storeId,
  });
}
