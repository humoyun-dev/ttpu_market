import { parseDecimalToMinorUnits } from "@/lib/utils/money";
import type {
  CreateProductInput,
  UpdateProductInput,
} from "@/features/seller/products/products.types";
import type { ProductFormValues } from "@/features/seller/products/products.schemas";

export function toCreateProductInput(values: ProductFormValues): CreateProductInput {
  const imageUrls = values.imageUrls
    ? values.imageUrls
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return {
    name: values.name.trim(),
    description: values.description?.trim() ? values.description.trim() : undefined,
    price: Number(parseDecimalToMinorUnits(values.price, { decimals: 0 })),
    stockQty: Number(values.stockQty),
    categoryId: values.categoryId?.trim() ? values.categoryId.trim() : undefined,
    sortOrder: Number(values.sortOrder),
    isActive: values.isActive,
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
  };
}

export function toUpdateProductInput(values: ProductFormValues): UpdateProductInput {
  const imageUrls = values.imageUrls
    ? values.imageUrls
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return {
    ...toCreateProductInput(values),
    categoryId: values.categoryId?.trim() ? values.categoryId.trim() : "",
    imageUrls,
  };
}
