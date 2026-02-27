import { env } from "@/lib/env/env";
import { httpClient } from "@/lib/http/client";
import type { Customer } from "@/features/seller/customers/customers.types";
import { mockGetCustomer, mockListCustomers } from "@/features/seller/customers/mocks";

export async function listCustomers(storeId: string): Promise<Customer[]> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockListCustomers(storeId);
  }
  return await httpClient<Customer[]>(`/stores/${storeId}/customers`);
}

export async function getCustomer(
  storeId: string,
  customerId: string
): Promise<Customer | null> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockGetCustomer(storeId, customerId);
  }
  return await httpClient<Customer>(`/stores/${storeId}/customers/${customerId}`);
}

