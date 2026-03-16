import { apiServerCall } from "@/lib/api/server";

export async function getMyProposalsServer() {
  const data = await apiServerCall("/api/proposals/myProposals");
  return data?.data || [];
}

export async function getJobProposalsServer(jobId) {
  const data = await apiServerCall(`/api/proposals/job/${jobId}`);
  return data?.data || [];
}

export async function getProposalByIdServer(proposalId) {
  const data = await apiServerCall(`/api/proposals/${proposalId}`);
  return data?.data || null;
}
