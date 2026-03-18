import { notFound } from "next/navigation";
import { ContractDetailPageClient } from "@/features/contracts/components/ContractDetailPageClient";
import { requireSession } from "@/lib/server/auth";
import { getContractByIdServer } from "@/lib/server/contracts";

export default async function ContractDetailPage({ params }) {
  const { user } = await requireSession();
  const { id } = await params;
  const contract = await getContractByIdServer(id);

  if (!contract) {
    notFound();
  }

  return (
    <ContractDetailPageClient
      contract={contract}
      currentUserId={user.id || user._id}
    />
  );
}
