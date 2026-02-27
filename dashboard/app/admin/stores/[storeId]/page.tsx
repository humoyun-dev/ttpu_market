import { EmptyState } from "@/components/shared/EmptyState";

export default function AdminStoreDetailPage({ params }: { params: { storeId: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Store</h1>
      <EmptyState
        title="Not wired yet"
        description={`BACKEND TASK: Implement /api/v1/admin/stores/${params.storeId} and publish OpenAPI response schemas.`}
      />
    </div>
  );
}
