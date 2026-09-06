/**
 * Generic content container with border and shadow.
 *
 * Uses BrandSurface for the same charcoal + burgundy gradient as the sidebar.
 * Extend with className for padding etc.
 */
import { type HTMLAttributes } from "react";
import { BrandSurface } from "@/components/ui/brand-surface";

export function Card({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <BrandSurface
      className={`rounded-xl border border-sidebar-border/40 shadow-card ${className}`}
      {...props}
    >
      {children}
    </BrandSurface>
  );
}
