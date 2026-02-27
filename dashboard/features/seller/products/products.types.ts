import type { components } from "@/lib/http/openapi";

export type Product = components["schemas"]["ProductDto"];
export type ProductDetail = components["schemas"]["ProductDetailDto"];

export type CreateProductInput = components["schemas"]["CreateProductDto"];
export type UpdateProductInput = components["schemas"]["UpdateProductDto"];

export type DeleteResponse = components["schemas"]["DeleteResponseDto"];
