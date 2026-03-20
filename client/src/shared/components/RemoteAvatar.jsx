import Image from "next/image";

export function RemoteAvatar({
  alt,
  fallback,
  size = 40,
  src,
  textSize = "var(--text-lg)",
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt || fallback}
        width={size}
        height={size}
        unoptimized
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          objectFit: "cover",
          border: "1px solid var(--color-border)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundColor: "var(--color-primary-lightest)",
        color: "var(--color-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "var(--font-weight-semibold)",
        fontSize: textSize,
      }}
    >
      {String(fallback || "U")
        .charAt(0)
        .toUpperCase()}
    </div>
  );
}
