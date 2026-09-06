/**
 * Inline message banner for errors or informational feedback.
 *
 * - error (default): validation failures, API errors
 * - info: success messages, hints
 */
import { type HTMLAttributes } from "react";

export function Alert({
  className = "",
  variant = "error",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: "error" | "info" }) {
  const styles =
    variant === "error"
      ? "border-error-border bg-error-bg text-burgundy-dark"
      : "border-border bg-background text-foreground-secondary";

  return (
    <div
      role="alert"
      className={`rounded-lg border px-4 py-3 text-sm ${styles} ${className}`}
      {...props}
    />
  );
}
