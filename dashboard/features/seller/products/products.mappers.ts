import { parseDecimalToMinorUnits } from "@/lib/utils/money";
import type {
  CreateProductInput,
  UpdateProductInput,
} from "@/features/seller/products/products.types";
import type { ProductFormValues } from "@/features/seller/products/products.schemas";

export function toCreateProductInput(values: ProductFormValues): CreateProductInput {
  return {
    name: values.name.trim(),
    description: values.description?.trim() ? values.description.trim() : null,
    priceMinor: parseDecimalToMinorUnits(values.price, { decimals: 2 }),
    currency: "UZS",
    isActive: values.isActive,
  };
}

export function toUpdateProductInput(values: ProductFormValues): UpdateProductInput {
  return toCreateProductInput(values);
}

