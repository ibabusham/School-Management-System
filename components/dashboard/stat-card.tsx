/**
 * Single metric tile for dashboards (e.g. "Exams: 12").
 *
 * Uses a description list (<dl>) for semantic HTML.
 * Set large=true for big headline numbers on overview pages.
 */
import { BrandSurface } from "@/components/ui/brand-surface";

export function StatCard({
  label,
  value,
  large = false,
  hint,
}: {
  label: string;
  value: string;
  large?: boolean;
  hint?: string;
}) {
  return (
    <BrandSurface className="rounded-xl border border-card-border/50 p-5 shadow-card">
      <dl>
        <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
          {label}
        </dt>
        <dd
          className={`mt-2 font-semibold text-white ${
            large ? "text-3xl tracking-tight" : "text-sm"
          }`}
        >
          {value}
        </dd>
        {hint ? (
          <p className="mt-1 text-xs text-sidebar-muted">{hint}</p>
        ) : null}
      </dl>
    </BrandSurface>
  );
}
