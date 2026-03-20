import { ContractDetailPageClient } from "@/features/contracts/components/ContractDetailPageClient";
import { getAdminContractServer } from "@/lib/server/admin";
import { requireAdminSession } from "@/lib/server/auth";

export default async function AdminContractDetailPage({ params }) {
  const [{ user }, resolvedParams] = await Promise.all([
    requireAdminSession(),
    params,
  ]);

  const contract = await getAdminContractServer(resolvedParams.id);

  return (
    <ContractDetailPageClient contract={contract} currentUserId={user?._id} />
  );
}
