import { apiServerCall } from "@/lib/api/server";

export async function listMyContractsServer() {
  const data = await apiServerCall("/api/contracts");
  return data?.data || [];
}

export async function getContractByIdServer(contractId) {
  const data = await apiServerCall(`/api/contracts/${contractId}`);
  return data?.data || null;
}

export async function getContractByProposalServer(proposalId) {
  const data = await apiServerCall(`/api/contracts/proposal/${proposalId}`);
  return data?.data || null;
}
