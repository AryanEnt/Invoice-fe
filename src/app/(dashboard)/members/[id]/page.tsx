import { MemberDetailPage } from "@/features/members/member-detail-page";

export default async function MemberDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MemberDetailPage memberId={id} />;
}
