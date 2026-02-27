import type { AdminSeller } from "@/features/admin/sellers/sellers.types";

function nowIso() {
  return new Date().toISOString();
}

let sellers: AdminSeller[] = [
  {
    id: "seller_1",
    email: "merchant@example.com",
    fullName: "Demo Merchant",
    isActive: true,
    storeCount: 2,
    createdAt: nowIso(),
  },
  {
    id: "seller_2",
    email: "inactive@example.com",
    fullName: "Inactive Seller",
    isActive: false,
    storeCount: 0,
    createdAt: nowIso(),
  },
];

export function mockListSellers(): AdminSeller[] {
  return [...sellers];
}

export function mockGetSeller(sellerId: string): AdminSeller | null {
  return sellers.find((s) => s.id === sellerId) ?? null;
}

export function mockSetSellerActive(sellerId: string, isActive: boolean): AdminSeller {
  const existing = mockGetSeller(sellerId);
  if (!existing) throw new Error("Seller not found");
  const updated: AdminSeller = { ...existing, isActive };
  sellers = sellers.map((s) => (s.id === sellerId ? updated : s));
  return updated;
}

