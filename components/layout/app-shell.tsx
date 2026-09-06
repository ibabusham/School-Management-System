/**
 * Authenticated app layout shell.
 *
 * Wraps all pages under app/(app)/ — provides:
 * - Auth guard (redirects to login if not signed in)
 * - Loading skeleton while auth state is checked
 * - Sidebar + main content area
 */
"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { BrandSurface } from "@/components/ui/brand-surface";
import { useRequireAuth } from "@/lib/auth/use-require-auth";

/** Placeholder skeleton shown while session is being read from storage. */
function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-72 shrink-0 bg-charcoal lg:block" />
      <div className="flex flex-1 flex-col gap-6 p-10">
        <div className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-border" />
          <div className="h-8 w-48 animate-pulse rounded-lg bg-border" />
          <div className="h-4 w-72 animate-pulse rounded bg-border" />
        </div>
        <BrandSurface className="h-64 animate-pulse rounded-xl border border-sidebar-border/40 opacity-80" />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) {
    return <DashboardLoading />;
  }

  // useRequireAuth redirects unauthenticated users; return null during redirect
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
