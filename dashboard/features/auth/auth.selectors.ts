import { useAuthStore } from "@/features/auth/auth.store";

export function useActiveStoreId(): string | null {
  return useAuthStore((s) => s.activeStoreId);
}
