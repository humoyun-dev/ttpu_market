import { httpClient } from "@/lib/http/client";
import type {
  CreateProductInput,
  DeleteResponse,
  Product,
  ProductDetail,
  UpdateProductInput,
} from "@/features/seller/products/products.types";

export async function listProducts(storeId: string): Promise<Product[]> {
  return await httpClient<Product[]>(`/api/v1/stores/${storeId}/products`);
}

export async function getProduct(
  storeId: string,
  productId: string
): Promise<ProductDetail> {
  return await httpClient<ProductDetail>(`/api/v1/stores/${storeId}/products/${productId}`);
}

export async function createProduct(
  storeId: string,
  input: CreateProductInput
): Promise<Product> {
  return await httpClient<Product>(`/api/v1/stores/${storeId}/products`, {
    method: "POST",
    body: input,
  });
}

export async function updateProduct(
  storeId: string,
  productId: string,
  input: UpdateProductInput
): Promise<Product> {
  return await httpClient<Product>(`/api/v1/stores/${storeId}/products/${productId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function deleteProduct(
  storeId: string,
  productId: string
): Promise<DeleteResponse> {
  return await httpClient<DeleteResponse>(`/api/v1/stores/${storeId}/products/${productId}`, {
    method: "DELETE",
  });
}
