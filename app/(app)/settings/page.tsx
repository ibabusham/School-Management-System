/**
 * Settings folder index — lists nested settings pages.
 *
 * Change password lives at /settings/change-password, not on this page.
 */
"use client";

import Link from "next/link";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PageHeader } from "@/components/layout/page-header";

export default function SettingsPage() {
  useRequireAuth(["ADMIN", "TEACHER", "STUDENT"]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Choose a settings page from this folder."
      />

      <DashboardSection
        title="Account"
        description="Security and password options."
      >
        <Link
          href="/settings/change-password"
          className="inline-flex w-full items-center justify-between rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15"
        >
          Change password
          <span className="text-sidebar-muted">→</span>
        </Link>
      </DashboardSection>
    </div>
  );
}
