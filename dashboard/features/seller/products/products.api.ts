import { env } from "@/lib/env/env";
import { httpClient } from "@/lib/http/client";
import type {
  CreateProductInput,
  Product,
  UpdateProductInput,
} from "@/features/seller/products/products.types";
import {
  mockCreateProduct,
  mockDeleteProduct,
  mockGetProduct,
  mockListProducts,
  mockUpdateProduct,
} from "@/features/seller/products/mocks";

export async function listProducts(storeId: string): Promise<Product[]> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockListProducts(storeId);
  }
  return await httpClient<Product[]>(`/stores/${storeId}/products`);
}

export async function getProduct(
  storeId: string,
  productId: string
): Promise<Product | null> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockGetProduct(storeId, productId);
  }
  return await httpClient<Product>(`/stores/${storeId}/products/${productId}`);
}

export async function createProduct(
  storeId: string,
  input: CreateProductInput
): Promise<Product> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockCreateProduct(storeId, input);
  }
  return await httpClient<Product>(`/stores/${storeId}/products`, {
    method: "POST",
    body: input,
  });
}

export async function updateProduct(
  storeId: string,
  productId: string,
  input: UpdateProductInput
): Promise<Product> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    return mockUpdateProduct(storeId, productId, input);
  }
  return await httpClient<Product>(`/stores/${storeId}/products/${productId}`, {
    method: "PUT",
    body: input,
  });
}

export async function deleteProduct(storeId: string, productId: string): Promise<void> {
  if (env.NEXT_PUBLIC_USE_MOCKS) {
    mockDeleteProduct(storeId, productId);
    return;
  }
  await httpClient<void>(`/stores/${storeId}/products/${productId}`, {
    method: "DELETE",
  });
}

