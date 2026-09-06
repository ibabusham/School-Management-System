"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { fetchStudents } from "@/lib/api/students";
import { fetchTeachers } from "@/lib/api/teachers";
import { fetchClasses } from "@/lib/api/classes";
import { fetchSubjects } from "@/lib/api/subjects";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export default function AdminDashboardPage() {
  const { user } = useRequireAuth(["ADMIN"]);
  const [counts, setCounts] = useState<{
    students: number;
    teachers: number;
    classes: number;
    subjects: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    void Promise.all([
      fetchStudents(1, 1),
      fetchTeachers(1, 1),
      fetchClasses(1, 1),
      fetchSubjects(1, 1),
    ])
      .then(([students, teachers, classes, subjects]) => {
        setCounts({
          students: students.pagination.total,
          teachers: teachers.pagination.total,
          classes: classes.pagination.total,
          subjects: subjects.pagination.total,
        });
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Failed to load dashboard."
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Admin Dashboard"
        description="School-wide counts and shortcuts at Shield's School."
      />

      {error ? <Alert>{error}</Alert> : null}

      {isLoading ? (
        <Card className="p-8">
          <p className="text-sm text-sidebar-muted">Loading dashboard...</p>
        </Card>
      ) : counts ? (
        <>
          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Students" value={String(counts.students)} large />
            <StatCard label="Teachers" value={String(counts.teachers)} large />
            <StatCard label="Classes" value={String(counts.classes)} large />
            <StatCard label="Subjects" value={String(counts.subjects)} large />
          </dl>

          <DashboardSection
            title="Quick links"
            description="Jump to admin pages."
          >
            <div className="flex flex-col gap-3">
              <Link
                href="/admin/students"
                className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
              >
                Students
              </Link>
              <Link
                href="/admin/teachers"
                className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
              >
                Teachers
              </Link>
              <Link
                href="/admin/classes"
                className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
              >
                Classes
              </Link>
              <Link
                href="/admin/subjects"
                className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
              >
                Subjects
              </Link>
            </div>
          </DashboardSection>
        </>
      ) : null}
    </div>
  );
}
