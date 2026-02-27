import { SellerProductDetailPage } from "@/features/seller/products/SellerProductDetailPage";

export default function SellerProductDetailRoute({
  params,
}: {
  params: { productId: string };
}) {
  return <SellerProductDetailPage productId={params.productId} />;
}
