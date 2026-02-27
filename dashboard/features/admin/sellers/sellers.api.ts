import { env } from "@/lib/env/env";
import { httpClient } from "@/lib/http/client";
import type { AdminSeller } from "@/features/admin/sellers/sellers.types";
import {
  mockGetSeller,
  mockListSellers,
  mockSetSellerActive,
} from "@/features/admin/sellers/mocks";

export async function listSellers(): Promise<AdminSeller[]> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockListSellers();
  }
  return await httpClient<AdminSeller[]>("/admin/sellers");
}

export async function getSeller(sellerId: string): Promise<AdminSeller | null> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockGetSeller(sellerId);
  }
  return await httpClient<AdminSeller>(`/admin/sellers/${sellerId}`);
}

export async function setSellerActive(
  sellerId: string,
  isActive: boolean
): Promise<AdminSeller> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockSetSellerActive(sellerId, isActive);
  }
  return await httpClient<AdminSeller>(`/admin/sellers/${sellerId}/status`, {
    method: "PATCH",
    body: { isActive },
  });
}

