export function WalletCoinIcon({ className, height = 18, width = 18 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 9v6" />
      <path d="M10 10.5h4" />
      <path d="M10 13.5h4" />
    </svg>
  );
}
