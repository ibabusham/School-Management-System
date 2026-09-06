/**
 * Dark branded surface with burgundy-to-black gradient and soft red glow.
 * Matches the visual treatment used in the sidebar and login panel.
 */
import { type HTMLAttributes } from "react";

export function BrandSurface({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative overflow-hidden bg-charcoal text-white ${className}`}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-burgundy-dark/50 via-charcoal to-ink"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 -top-8 h-32 w-32 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
