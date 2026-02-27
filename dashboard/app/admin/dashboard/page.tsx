export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Platform Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        BACKEND TASK: Implement admin metrics endpoints under <code>/api/v1/admin/*</code> and
        publish response schemas in OpenAPI. This UI will be wired once the contract exists.
      </p>
    </div>
  );
}
