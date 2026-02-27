import type { components } from "@/lib/http/openapi";

export type Product = unknown;

export type CreateProductInput = components["schemas"]["CreateProductDto"];
export type UpdateProductInput = components["schemas"]["UpdateProductDto"];
