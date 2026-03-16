import { getMyJobsServer } from "@/lib/server/jobs";
import {
  getJobProposalsServer,
  getMyProposalsServer,
} from "@/lib/server/proposals";
import { JOB_STATUS, PROPOSAL_STATUS } from "@/shared/constants/statuses";

export async function getClientContractsServer() {
  return getMyJobsServer();
}

export async function getClientProposalsByContractServer() {
  const contracts = await getMyJobsServer();
  const proposalsByContractEntries = await Promise.all(
    contracts.map(async (contract) => [
      contract._id,
      await getJobProposalsServer(contract._id),
    ]),
  );

  return {
    contracts,
    proposalsByContract: Object.fromEntries(proposalsByContractEntries),
  };
}

export async function getFreelancerActiveProposalsServer() {
  const proposals = await getMyProposalsServer();

  return proposals.filter((proposal) =>
    [PROPOSAL_STATUS.PENDING, PROPOSAL_STATUS.REJECTED].includes(
      proposal.status,
    ),
  );
}

export async function getFreelancerOngoingJobsServer() {
  const proposals = await getMyProposalsServer();

  return proposals
    .filter(
      (proposal) =>
        proposal.status === PROPOSAL_STATUS.ACCEPTED &&
        proposal.job &&
        proposal.job.status === JOB_STATUS.IN_PROGRESS,
    )
    .map((proposal) => ({
      ...proposal.job,
      status: proposal.job.status,
    }));
}
