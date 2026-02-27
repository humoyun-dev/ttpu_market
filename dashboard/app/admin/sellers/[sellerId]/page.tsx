import { EmptyState } from "@/components/shared/EmptyState";

export default function AdminSellerDetailPage({ params }: { params: { sellerId: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Seller</h1>
      <EmptyState
        title="Not wired yet"
        description={`BACKEND TASK: Implement /api/v1/admin/sellers/${params.sellerId} and publish OpenAPI response schemas.`}
      />
    </div>
  );
}
