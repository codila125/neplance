import Link from "next/link";
import { requireSession } from "@/lib/server/auth";
import { getChainBlocksServer } from "@/lib/server/blockchain";

const formatDate = (value) => {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const trimHash = (value = "") => {
  if (!value || value.length <= 16) {
    return value || "-";
  }

  return `${value.slice(0, 10)}...${value.slice(-8)}`;
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
                  <span className="chain-time text-muted">
                    Synced {formatDate(block.sourceFetchedAt)}
                  </span>
                </div>

                <div className="chain-hash-wrap">
                  <div className="chain-hash-line">
                    <span className="chain-hash-label">Hash</span>
                    <code>{trimHash(block.hash)}</code>
                  </div>
                  <div className="chain-hash-line">
                    <span className="chain-hash-label">Prev</span>
                    <code>{trimHash(block.prevHash)}</code>
                  </div>
                </div>

                <div className="chain-stats-row">
                  <div className="chain-stat-pill">
                    <span className="text-muted">Contracts</span>
                    <strong>{block.contracts?.length || 0}</strong>
                  </div>
                </div>

                {block.contracts?.length > 0 && (
                  <div className="chain-id-grid">
                    <div className="chain-id-section">
                      <div className="chain-id-title">Contract IDs</div>
                      {block.contracts?.length > 0 ? (
                        block.contracts.map((contract) => (
                          <div
                            key={contract.id || `${block.hash}-contract`}
                            className="chain-id-chip"
                          >
                            <code>{contract.id || "Unknown contract id"}</code>
                          </div>
                        ))
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
