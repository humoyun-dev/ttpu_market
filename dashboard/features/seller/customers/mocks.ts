import type { Customer } from "@/features/seller/customers/customers.types";

function nowIso() {
  return new Date().toISOString();
}

const customers: Customer[] = [
  {
    id: "cust_1",
    storeId: "store_1",
    fullName: "Alice",
    phone: null,
    telegramId: "10001",
    createdAt: nowIso(),
  },
  {
    id: "cust_2",
    storeId: "store_1",
    fullName: "Bob",
    phone: "+998901234567",
    telegramId: "10002",
    createdAt: nowIso(),
  },
  {
    id: "cust_3",
    storeId: "store_2",
    fullName: "Carol",
    phone: null,
    telegramId: "20001",
    createdAt: nowIso(),
  },
];

export function mockListCustomers(storeId: string): Customer[] {
  return customers.filter((c) => c.storeId === storeId);
}

export function mockGetCustomer(storeId: string, customerId: string): Customer | null {
  return customers.find((c) => c.storeId === storeId && c.id === customerId) ?? null;
}

