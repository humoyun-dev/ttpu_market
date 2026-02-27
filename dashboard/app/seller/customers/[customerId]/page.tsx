import { EmptyState } from "@/components/shared/EmptyState";

export default function SellerCustomerDetailPage({ params }: { params: { customerId: string } }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Customer</h1>
      <EmptyState
        title="Not wired yet"
        description={`BACKEND TASK: Implement store-scoped customer detail endpoints and OpenAPI schemas (customer ${params.customerId}).`}
      />
    </div>
  );
}
