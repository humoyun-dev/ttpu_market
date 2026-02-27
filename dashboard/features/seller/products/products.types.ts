export type Product = {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  priceMinor: string;
  currency: "UZS";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = {
  name: string;
  description: string | null;
  priceMinor: string;
  currency: "UZS";
  isActive: boolean;
};

export type UpdateProductInput = Partial<CreateProductInput>;

