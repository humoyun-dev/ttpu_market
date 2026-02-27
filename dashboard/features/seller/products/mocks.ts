import type {
  CreateProductInput,
  Product,
  UpdateProductInput,
} from "@/features/seller/products/products.types";

function nowIso() {
  return new Date().toISOString();
}

let products: Product[] = [
  {
    id: "prod_1",
    storeId: "store_1",
    name: "Demo Product A",
    description: "Example product for mock mode",
    priceMinor: "199900",
    currency: "UZS",
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "prod_2",
    storeId: "store_1",
    name: "Demo Product B",
    description: null,
    priceMinor: "49900",
    currency: "UZS",
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "prod_3",
    storeId: "store_2",
    name: "Store 2 Product",
    description: null,
    priceMinor: "9900",
    currency: "UZS",
    isActive: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

export function mockListProducts(storeId: string): Product[] {
  return products.filter((p) => p.storeId === storeId);
}

export function mockGetProduct(storeId: string, productId: string): Product | null {
  return products.find((p) => p.storeId === storeId && p.id === productId) ?? null;
}

export function mockCreateProduct(storeId: string, input: CreateProductInput): Product {
  const created: Product = {
    id: `prod_${Math.random().toString(16).slice(2, 10)}`,
    storeId,
    name: input.name,
    description: input.description,
    priceMinor: input.priceMinor,
    currency: input.currency,
    isActive: input.isActive,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  products = [created, ...products];
  return created;
}

export function mockUpdateProduct(
  storeId: string,
  productId: string,
  input: UpdateProductInput
): Product {
  const existing = mockGetProduct(storeId, productId);
  if (!existing) {
    throw new Error("Product not found");
  }
  const updated: Product = {
    ...existing,
    ...input,
    updatedAt: nowIso(),
  };
  products = products.map((p) => (p.id === productId ? updated : p));
  return updated;
}

export function mockDeleteProduct(storeId: string, productId: string) {
  products = products.filter((p) => !(p.storeId === storeId && p.id === productId));
}

