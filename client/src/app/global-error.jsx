"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body>
        <div className="neplance-error-shell" role="alert">
          <div className="neplance-error-panel">
            <p className="neplance-error-eyebrow">Neplance</p>
            <h2 className="neplance-error-title">
              The app hit an unexpected error.
            </h2>
            <p className="neplance-error-copy">
              Please refresh the page and try again. If this keeps happening,
              check the server logs before deploying.
            </p>
            <div className="neplance-error-actions">
              <button type="button" className="btn btn-primary" onClick={reset}>
                Try again
              </button>
            </div>
            {process.env.NODE_ENV !== "production" && error?.message ? (
              <pre className="neplance-error-debug">{error.message}</pre>
            ) : null}
          </div>
        </div>
      </body>
    </html>
  );
}
