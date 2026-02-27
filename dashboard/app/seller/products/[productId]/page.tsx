import { EmptyState } from "@/components/shared/EmptyState";

export default function SellerProductDetailPage({ params }: { params: { productId: string } }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit Product</h1>
      <EmptyState
        title="Not wired yet"
        description={`BACKEND TASK: Add OpenAPI response schemas for store-scoped product detail/update/delete endpoints (product ${params.productId}).`}
      />
    </div>
  );
}
