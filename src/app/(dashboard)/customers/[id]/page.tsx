import { CustomerDetailPage } from "@/features/customers/customer-detail-page";

export default async function CustomerDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerDetailPage customerId={id} />;
}
