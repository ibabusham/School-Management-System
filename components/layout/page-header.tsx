/**
 * Page title block used at the top of every dashboard page.
 *
 * Rendered inside a Card so it matches other page sections.
 * - breadcrumbs: optional trail above the eyebrow
 * - eyebrow: small red label above the title (e.g. "Teacher Portal")
 * - title: main heading (h1)
 * - description: optional subtitle text
 */
import Link from "next/link";
import { Card } from "@/components/ui/card";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
}) {
  return (
    <Card className="px-8 py-8">
      <header className="mx-auto max-w-3xl">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-sidebar-muted">
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                    {index > 0 ? (
                      <span aria-hidden className="text-sidebar-muted/60">
                        /
                      </span>
                    ) : null}
                    {item.href && !isLast ? (
                      <Link
                        href={item.href}
                        className="text-sidebar-muted transition-colors hover:text-white"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className={isLast ? "text-white" : undefined}>
                        {item.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}
        {eyebrow ? (
          <p className="text-xs font-extrabold uppercase tracking-widest text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-base font-bold leading-relaxed text-sidebar-muted">
            {description}
          </p>
        ) : null}
      </header>
    </Card>
  );
}
