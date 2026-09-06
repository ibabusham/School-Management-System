/**
 * Stub page for routes that are not built yet.
 *
 * Shows a header + "Coming soon" card. Replace with a real page
 * when you wire up the feature.
 */
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export function PlaceholderPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Card className="flex flex-col items-center justify-center p-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-6 w-6 text-sidebar-muted"
            aria-hidden
          >
            <path
              d="M12 6v6l4 2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-white">
          Coming soon
        </p>
        <p className="mt-1 max-w-sm text-sm text-sidebar-muted">
          This section is under development and will be available in a future
          update.
        </p>
      </Card>
    </div>
  );
}
