import { parseDecimalToMinorUnits } from "@/lib/utils/money";
import type {
  CreateProductInput,
  UpdateProductInput,
} from "@/features/seller/products/products.types";
import type { ProductFormValues } from "@/features/seller/products/products.schemas";

export function toCreateProductInput(values: ProductFormValues): CreateProductInput {
  return {
    name: values.name.trim(),
    description: values.description?.trim() ? values.description.trim() : undefined,
    price: Number(parseDecimalToMinorUnits(values.price, { decimals: 0 })),
    isActive: values.isActive,
  };
}

export function toUpdateProductInput(values: ProductFormValues): UpdateProductInput {
  return toCreateProductInput(values);
}
