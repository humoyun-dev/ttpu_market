import type { Customer } from "@/features/seller/customers/customers.types";

export async function listCustomers(storeId: string): Promise<Customer[]> {
  // BACKEND TASK: implement `GET /api/v1/stores/:storeId/customers` (or a TelegramCustomer endpoint)
  // and document response schema in OpenAPI.
  throw new Error(
    `BACKEND TASK: Customers endpoints are not implemented (requested storeId=${storeId}).`
  );
}

export async function getCustomer(
  storeId: string,
  customerId: string
): Promise<Customer | null> {
  // BACKEND TASK: implement `GET /api/v1/stores/:storeId/customers/:customerId` and document in OpenAPI.
  throw new Error(
    `BACKEND TASK: Customers endpoints are not implemented (requested storeId=${storeId}, customerId=${customerId}).`
  );
}
