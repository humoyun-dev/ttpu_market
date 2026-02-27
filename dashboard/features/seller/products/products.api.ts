import { httpClient } from "@/lib/http/client";
import type {
  CreateProductInput,
  UpdateProductInput,
} from "@/features/seller/products/products.types";

export async function listProducts(storeId: string): Promise<unknown> {
  // BACKEND TASK: add OpenAPI response schema for `GET /api/v1/stores/:storeId/products`.
  return await httpClient<unknown>(`/api/v1/stores/${storeId}/products`);
}

export async function getProduct(
  storeId: string,
  productId: string
): Promise<unknown> {
  // BACKEND TASK: add OpenAPI response schema for `GET /api/v1/stores/:storeId/products/:id`.
  return await httpClient<unknown>(`/api/v1/stores/${storeId}/products/${productId}`);
}

export async function createProduct(
  storeId: string,
  input: CreateProductInput
): Promise<unknown> {
  // BACKEND TASK: add OpenAPI response schema for `POST /api/v1/stores/:storeId/products`.
  return await httpClient<unknown>(`/api/v1/stores/${storeId}/products`, {
    method: "POST",
    body: input,
  });
}

export async function updateProduct(
  storeId: string,
  productId: string,
  input: UpdateProductInput
): Promise<unknown> {
  // BACKEND TASK: add OpenAPI response schema for `PATCH /api/v1/stores/:storeId/products/:id`.
  return await httpClient<unknown>(`/api/v1/stores/${storeId}/products/${productId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function deleteProduct(storeId: string, productId: string): Promise<void> {
  // BACKEND TASK: add OpenAPI response schema for `DELETE /api/v1/stores/:storeId/products/:id`.
  await httpClient<void>(`/api/v1/stores/${storeId}/products/${productId}`, {
    method: "DELETE",
  });
}
