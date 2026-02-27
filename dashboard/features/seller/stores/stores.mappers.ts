import type {
  CreateStoreInput,
  UpdateStoreInput,
} from "@/features/seller/stores/stores.types";
import type { StoreFormValues } from "@/features/seller/stores/stores.schemas";

export function toCreateStoreInput(values: StoreFormValues): CreateStoreInput {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: values.description?.trim() ? values.description.trim() : undefined,
    logoUrl: values.logoUrl?.trim() ? values.logoUrl.trim() : undefined,
    supportedLanguages: values.supportedLanguages,
    defaultLanguage: values.defaultLanguage,
    currency: values.currency,
    timezone: values.timezone,
  };
}

export function toUpdateStoreInput(values: StoreFormValues): UpdateStoreInput {
  return {
    ...toCreateStoreInput(values),
    status: values.status,
  };
}

