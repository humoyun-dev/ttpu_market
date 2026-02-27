import type { Role } from "@/lib/constants/roles";
import { useAuthStore } from "@/features/auth/auth.store";

export function useRole(): Role | null {
  return useAuthStore((s) => s.role);
}

export function useActiveStoreId(): string | null {
  return useAuthStore((s) => s.activeStoreId);
}

