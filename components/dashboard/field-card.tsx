/**
 * Small branded field box for nested data inside a larger card.
 * Same gradient/glow as the sidebar, sized for profile field grids.
 */
import { BrandSurface } from "@/components/ui/brand-surface";

export function FieldCard({ children }: { children: React.ReactNode }) {
  return (
    <BrandSurface className="rounded-lg border border-sidebar-border/40 p-4 shadow-card">
      {children}
    </BrandSurface>
  );
}
