export default function Loading() {
  return (
    <div className="neplance-loading-shell" aria-live="polite" aria-busy="true">
      <div className="neplance-loading-panel">
        <div className="neplance-loading-mark" aria-hidden="true">
          <span className="neplance-loading-mark-main" />
          <span className="neplance-loading-mark-side neplance-loading-mark-side-left" />
          <span className="neplance-loading-mark-side neplance-loading-mark-side-right" />
        </div>
        <p className="neplance-loading-eyebrow">Neplance</p>
        <h2 className="neplance-loading-title">Loading your workspace</h2>
        <p className="neplance-loading-copy">
          Preparing contracts, jobs, messages, and wallet state.
        </p>
        <div className="neplance-loading-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
