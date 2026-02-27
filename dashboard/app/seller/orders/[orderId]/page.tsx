import { EmptyState } from "@/components/shared/EmptyState";

export default function SellerOrderDetailPage({ params }: { params: { orderId: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
      <EmptyState
        title="Not wired yet"
        description={`BACKEND TASK: Add OpenAPI response schemas for store-scoped order detail and status update endpoints (order ${params.orderId}).`}
      />
    </div>
  );
}
