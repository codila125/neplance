import { formatContractDateTime } from "./contractDetailUtils";

export function ContractAttachmentsTimelineSection({
  contract,
  timelineEvents,
}) {
  return (
    <>
      {contract.job?.attachments?.length > 0 ? (
        <div className="mb-6">
          <h3 className="mb-3">Job Attachments</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-2)",
            }}
          >
            {contract.job.attachments.map((attachment, index) => (
              <a
                key={attachment}
                href={attachment}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
              >
                Job File {index + 1}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {contract.proposal?.attachments?.length > 0 ? (
        <div className="mb-6">
          <h3 className="mb-3">Proposal Attachments</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-2)",
            }}
          >
            {contract.proposal.attachments.map((attachment, index) => (
              <a
                key={attachment}
                href={attachment}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
              >
                Proposal File {index + 1}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {timelineEvents.length > 0 ? (
        <div className="mb-6">
          <h3 className="mb-3">Activity Timeline</h3>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {timelineEvents.map((event) => (
              <div key={event.key} className="card-sm">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    flexWrap: "wrap",
                    alignItems: "center",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  <strong>{event.title}</strong>
                  <span className="text-sm text-muted">
                    {formatContractDateTime(event.at)}
                  </span>
                </div>
                <p className="text-secondary mb-0">{event.description}</p>
                {event.attachments?.length ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "var(--space-2)",
                      marginTop: "var(--space-3)",
                    }}
                  >
                    {event.attachments.map((attachment, index) => (
                      <a
                        key={`${event.key}-${attachment.url}-${index}`}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm"
                      >
                        {attachment.name || `Attachment ${index + 1}`}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
