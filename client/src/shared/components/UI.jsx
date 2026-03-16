import { useId } from "react";

export const Input = ({ label, className = "", error, ...props }) => {
  const id = useId();
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`form-input ${error ? "form-input-error" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p
          className="form-error"
          style={{
            color: "var(--color-error)",
            fontSize: "0.75rem",
            marginTop: "0.25rem",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export const Button = ({
  variant = "primary",
  className = "",
  children,
  ...props
}) => {
  const variantClass = {
    primary: "btn btn-primary",
    secondary: "btn btn-secondary",
    ghost: "btn btn-ghost",
  };

  return (
    <button
      className={`${variantClass[variant] || "btn btn-primary"} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
