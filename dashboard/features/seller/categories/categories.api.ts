import { httpClient } from "@/lib/http/client";
import type { CategoryListItem } from "@/features/seller/categories/categories.types";

export async function listCategories(storeId: string): Promise<CategoryListItem[]> {
  return await httpClient<CategoryListItem[]>(`/api/v1/stores/${storeId}/categories`);
}

