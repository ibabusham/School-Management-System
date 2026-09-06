/**
 * Small branded field box for nested data inside a larger card.
 * Same gray mix as other cards, sized for profile field grids.
 */
import { BrandSurface } from "@/components/ui/brand-surface";

export function FieldCard({ children }: { children: React.ReactNode }) {
  return (
    <BrandSurface className="rounded-xl border border-card-border/50 p-6 text-center font-bold shadow-card">
      {children}
    </BrandSurface>
  );
}
