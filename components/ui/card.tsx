/**
 * Generic content container with border and shadow.
 *
 * Uses BrandSurface for a gray mix (slate / charcoal) instead of burgundy.
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
      className={`rounded-2xl border border-card-border/50 text-center font-bold shadow-card ${className}`}
      {...props}
    >
      {children}
    </BrandSurface>
  );
}
