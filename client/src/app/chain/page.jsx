import Link from "next/link";
import { requireSession } from "@/lib/server/auth";
import { getChainBlocksServer } from "@/lib/server/blockchain";
import { formatStatus } from "@/shared/utils/job";

const trimHash = (value = "") => {
  if (!value || value.length <= 16) {
    return value || "-";
  }

  return `${value.slice(0, 10)}...${value.slice(-8)}`;
};

const formatContractAmount = (total, currency = "NPR") => {
  const safeTotal = Number.isFinite(total) ? total : 0;
  const safeCurrency = currency || "NPR";
  return `${safeCurrency} ${safeTotal.toLocaleString()}`;
};

const getBlockContracts = (block) => {
  if (Array.isArray(block?.contracts)) {
    return block.contracts;
  }
  if (Array.isArray(block?.contract)) {
    return block.contract;
  }
  return [];
};

const getContractId = (contract) =>
  String(contract?.id || contract?._id || "").trim();

const getBackendContractAmountLabel = (contract) => {
  const candidates = [
    contract?.calculatedTotal,
    contract?.calculated_total,
    contract?.totalMilestoneValue,
    contract?.total_milestone_value,
    contract?.contractValue,
    contract?.contract_value,
    contract?.totalAmount,
    contract?.total_amount,
  ];

  const rawAmount = candidates.find(
    (value) => value !== null && value !== undefined,
  );
  const amount = Number(rawAmount);

  if (!Number.isFinite(amount)) {
    return "N/A";
  }

  return formatContractAmount(amount, contract?.currency || "NPR");
};

export default async function ChainPage({ searchParams }) {
  await requireSession();

  const resolvedSearchParams = await searchParams;
  const requestedPage = Number(resolvedSearchParams?.page) || 1;
  const {
    data: blocks,
    page,
    pages,
    total,
  } = await getChainBlocksServer(requestedPage, 10);

  return (
    <main className="section section-sm">
      <div className="container max-w-4xl">
        <section className="card chain-hero-card">
          <div>
            <h1 className="mb-2">Blockchain Explorer</h1>
          </div>
          <div className="chain-meta-row">
            <span className="badge badge-primary">Total Blocks: {total}</span>
            <span className="badge badge-secondary">Total Pages: {pages}</span>
            <span className="badge badge-success">
              Page {page} of {pages}
            </span>
          </div>
        </section>

        {blocks.length === 0 ? (
          <section className="card chain-empty-card">
            <p className="text-muted mb-0">
              No chain data found yet. Try refreshing this page.
            </p>
          </section>
        ) : (
          <div className="chain-grid">
            {blocks.map((block) => (
              <article key={block.hash} className="card chain-block-card">
                <div className="chain-block-top">
                  <span className="badge badge-primary">
                    Block #{block.blockIndex}
                  </span>
                </div>

                <div className="chain-hash-wrap">
                  <div className="chain-hash-line">
                    <span className="chain-hash-label">Hash</span>
                    <code>{trimHash(block.hash)}</code>
                  </div>
                  <div className="chain-hash-line">
                    <span className="chain-hash-label">Prev</span>
                    <code>{trimHash(block.prevHash || block.prev_hash)}</code>
                  </div>
                </div>

                <div className="chain-stats-row">
                  <div className="chain-stat-pill">
                    <span className="text-muted">Contracts</span>
                    <strong>{getBlockContracts(block).length}</strong>
                  </div>
                </div>

                {getBlockContracts(block).length > 0 && (
                  <div className="chain-id-grid">
                    <div className="chain-id-section">
                      <div className="chain-id-title">Contract IDs</div>
                      {getBlockContracts(block).length > 0 ? (
                        getBlockContracts(block).map((contract) => {
                          const contractId = getContractId(contract);
                          const amountLabel = getBackendContractAmountLabel(contract);

                          return (
                            <div
                              key={contractId || `${block.hash}-contract`}
                              className="chain-id-chip"
                            >
                              <code>{contractId || "Unknown contract id"}</code>
                              <div className="chain-id-subtitle">
                                {contract.title || "Untitled contract"}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "var(--space-2)",
                                  marginTop: "var(--space-2)",
                                }}
                              >
                                <span className="badge badge-success">
                                  Total: {amountLabel}
                                </span>
                                <span className="badge badge-primary">
                                  State: {formatStatus(contract.status)}
                                </span>
                              </div>
                              {Array.isArray(contract.milestoneTitles) &&
                              contract.milestoneTitles.length > 0 ? (
                                <div className="chain-milestone-list">
                                  {contract.milestoneTitles.map(
                                    (milestoneTitle, index) => (
                                      <span
                                        key={`${contractId || block.hash}-milestone-${index}`}
                                        className="chain-milestone-chip"
                                      >
                                        {milestoneTitle}
                                      </span>
                                    ),
                                  )}
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-muted mb-0">
                          No contracts in this block.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <div className="chain-pagination-wrap">
          <div className="chain-pagination">
            {page > 1 ? (
              <Link
                href={`/chain?page=${page - 1}`}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </Link>
            ) : (
              <span className="btn btn-secondary btn-sm" aria-disabled="true">
                Previous
              </span>
            )}

            <span className="text-muted">Page {page}</span>

            {page < pages ? (
              <Link
                href={`/chain?page=${page + 1}`}
                className="btn btn-secondary btn-sm"
              >
                Next
              </Link>
            ) : (
              <span className="btn btn-secondary btn-sm" aria-disabled="true">
                Next
              </span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
