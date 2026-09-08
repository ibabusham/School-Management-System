/**
 * Dark card surface with a red glow.
 * Used by cards, stat tiles, and field boxes.
 */
import { type HTMLAttributes } from "react";

export function BrandSurface({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative overflow-hidden bg-card-bg text-white ${className}`}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/25 via-card-bg to-ink"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-12 -top-10 h-36 w-36 rounded-full bg-accent/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-ink/50 blur-3xl"
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
