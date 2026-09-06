/**
 * Page title block used at the top of every dashboard page.
 *
 * Rendered inside a Card so it matches other page sections.
 * - eyebrow: small red label above the title (e.g. "Teacher Portal")
 * - title: main heading (h1)
 * - description: optional subtitle text
 */
import { Card } from "@/components/ui/card";

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <Card className="px-6 py-5">
      <header>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sidebar-muted">
            {description}
          </p>
        ) : null}
      </header>
    </Card>
  );
}
