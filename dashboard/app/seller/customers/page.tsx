"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useRequiredStoreId } from "@/features/auth/useRequiredStoreId";
import { listCustomers } from "@/features/seller/customers/customers.api";
import type { Customer } from "@/features/seller/customers/customers.types";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export default function SellerCustomersPage() {
  const storeId = useRequiredStoreId();

  const customersQuery = useQuery({
    queryKey: ["seller", "customers", storeId],
    queryFn: () => listCustomers(storeId),
    enabled: Boolean(storeId),
  });

  const customers = customersQuery.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>

      {customersQuery.isLoading ? <LoadingSkeleton lines={6} /> : null}
      {customersQuery.isError ? (
        <ErrorState title="Failed to load customers" message="Please try again." />
      ) : null}

      {customersQuery.isSuccess && customers.length === 0 ? (
        <EmptyState title="No customers" description="No customers found for this store." />
      ) : null}

      {customersQuery.isSuccess && customers.length > 0 ? (
        <DataTable<Customer>
          columns={[
            {
              header: "Name",
              cell: (c) => (
                <Link className="font-medium hover:underline" href={`/seller/customers/${c.id}`}>
                  {c.fullName}
                </Link>
              ),
            },
            { header: "Telegram", cell: (c) => c.telegramId },
            { header: "Phone", cell: (c) => c.phone ?? "—" },
          ]}
          data={customers}
        />
      ) : null}
    </div>
  );
}
