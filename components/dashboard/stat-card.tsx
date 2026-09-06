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
    <BrandSurface className="flex min-h-36 items-center justify-center rounded-2xl border border-card-border/50 p-8 text-center shadow-card">
      <dl>
        <dt className="text-xs font-extrabold uppercase tracking-wider text-sidebar-muted">
          {label}
        </dt>
        <dd
          className={`mt-2 font-extrabold text-white ${
            large ? "text-4xl tracking-tight" : "text-base"
          }`}
        >
          {value}
        </dd>
        {hint ? (
          <p className="mt-1 text-xs font-bold text-sidebar-muted">{hint}</p>
        ) : null}
      </dl>
    </BrandSurface>
  );
}
