export function AuthLayoutShell({ children, description, title }) {
  return (
    <main
      style={{
        background:
          "linear-gradient(135deg, var(--color-bg-page) 0%, var(--color-primary-lightest) 50%, var(--color-bg-page) 100%)",
        minHeight: "calc(100vh - 72px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(12, 160, 8, 0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(12, 160, 8, 0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: "var(--space-12)",
          paddingBottom: "var(--space-12)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "560px",
            animation: "slideUp 0.4s ease-out",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "var(--space-6)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto var(--space-4)",
                borderRadius: "var(--radius-xl)",
                background:
                  "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-primary)",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <title>Neplance</title>
                <path
                  d="M12 10L16 20L20 10"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 15H22"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h1
              style={{
                fontSize: "var(--text-2xl)",
                fontWeight: "var(--font-weight-bold)",
                marginBottom: "var(--space-2)",
                color: "var(--color-text)",
              }}
            >
              {title}
            </h1>
            <p
              style={{
                color: "var(--color-text-secondary)",
                margin: 0,
              }}
            >
              {description}
            </p>
          </div>

          <div className="card" style={{ maxWidth: "560px", width: "100%" }}>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
