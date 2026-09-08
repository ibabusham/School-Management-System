/**
 * Card section for dashboard content blocks.
 *
 * Similar to DataTableCard header but for arbitrary children
 * (lists, profile summaries, etc.). Optional header link
 * navigates to a related full page.
 */
import Link from "next/link";
import { Card } from "@/components/ui/card";

export function DashboardSection({
  title,
  description,
  href,
  linkLabel,
  children,
}: {
  title: string;
  description?: string;
  /** If provided with linkLabel, shows a "View all" style link in the header. */
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col items-center gap-4 border-b border-white/10 px-8 py-6 text-center">
        <div>
          <h2 className="text-lg font-extrabold text-white">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm font-bold text-sidebar-muted">{description}</p>
          ) : null}
        </div>
        {href && linkLabel ? (
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/15"
          >
            {linkLabel}
          </Link>
        ) : null}
      </div>
      <div className="p-8 text-center font-bold">{children}</div>
    </Card>
  );
}
