"use client";

export function ActionModal({
  open,
  title = "Notice",
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  isPending = false,
  tone = "default",
  hideCancel = false,
}) {
  if (!open) {
    return null;
  }

  const confirmButtonStyle =
    tone === "danger"
      ? {
          backgroundColor: "var(--color-error)",
          color: "white",
        }
      : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "var(--space-4)",
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !isPending) {
          onClose?.();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !isPending) {
          onClose?.();
        }
      }}
    >
      <div className="card" style={{ maxWidth: "420px", width: "100%" }}>
        <h3 style={{ marginBottom: "var(--space-4)" }}>{title}</h3>
        <p className="text-light" style={{ marginBottom: "var(--space-6)" }}>
          {message}
        </p>
        <div
          style={{
            display: "flex",
            gap: "var(--space-3)",
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {!hideCancel ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isPending}
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            className="btn"
            style={confirmButtonStyle}
            onClick={onConfirm}
            disabled={isPending}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
