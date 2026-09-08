/**
 * Friendly empty-state block for tables and dashboard lists.
 */
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-white ring-1 ring-primary/30">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className="text-base font-extrabold text-white">{title}</p>
      {description ? (
        <p className="text-sm font-bold text-sidebar-muted">{description}</p>
      ) : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
