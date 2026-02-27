import { SellerStoreDetailPage } from "@/features/seller/stores/SellerStoreDetailPage";

export default function SellerStoreDetailRoute({
  params,
}: {
  params: { storeId: string };
}) {
  return <SellerStoreDetailPage storeId={params.storeId} />;
}

