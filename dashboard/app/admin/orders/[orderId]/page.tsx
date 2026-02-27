import { EmptyState } from "@/components/shared/EmptyState";

export default function AdminOrderDetailPage({ params }: { params: { orderId: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
      <EmptyState
        title="Not wired yet"
        description={`BACKEND TASK: Implement /api/v1/admin/orders/${params.orderId} and publish OpenAPI response schemas.`}
      />
    </div>
  );
}
