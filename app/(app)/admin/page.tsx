"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  fetchAcademicYears,
  type AcademicYear,
} from "@/lib/api/academic-years";
import { fetchStudents, type StudentSummary } from "@/lib/api/students";
import { fetchTeachers } from "@/lib/api/teachers";
import { fetchClasses } from "@/lib/api/classes";
import { fetchSubjects } from "@/lib/api/subjects";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardBarChart } from "@/components/dashboard/dashboard-bar-chart";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { FieldCard } from "@/components/dashboard/field-card";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils/dates";

export default function AdminDashboardPage() {
  const { user } = useRequireAuth(["ADMIN"]);
  const [counts, setCounts] = useState<{
    students: number;
    teachers: number;
    classes: number;
    subjects: number;
  } | null>(null);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [recentStudents, setRecentStudents] = useState<StudentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    void Promise.all([
      fetchStudents(1, 5),
      fetchTeachers(1, 1),
      fetchClasses(1, 1),
      fetchSubjects(1, 1),
      fetchAcademicYears(1, 20),
    ])
      .then(([students, teachers, classes, subjects, academicYears]) => {
        setCounts({
          students: students.pagination.total,
          teachers: teachers.pagination.total,
          classes: classes.pagination.total,
          subjects: subjects.pagination.total,
        });
        setRecentStudents(students.data);
        setYears(academicYears.data);
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

  const activeYear = years.find((year) => year.status === "ACTIVE") ?? null;
  const otherYears = years.filter((year) => year.id !== activeYear?.id);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Administration"
        title="Admin Dashboard"
        description="School-wide counts and the current academic year at Shield's School."
      />

      {error ? <Alert>{error}</Alert> : null}

      {isLoading ? (
        <Card className="p-8">
          <p className="text-sm text-sidebar-muted">Loading dashboard...</p>
        </Card>
      ) : counts ? (
        <>
          <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Students" value={String(counts.students)} large />
            <StatCard label="Teachers" value={String(counts.teachers)} large />
            <StatCard label="Classes" value={String(counts.classes)} large />
            <StatCard label="Subjects" value={String(counts.subjects)} large />
          </dl>

          <DashboardSection
            title="School overview"
            description="How many records exist across the portal."
          >
            <DashboardBarChart
              data={[
                { name: "Students", value: counts.students },
                { name: "Teachers", value: counts.teachers },
                { name: "Classes", value: counts.classes },
                { name: "Subjects", value: counts.subjects },
              ]}
            />
          </DashboardSection>

          <div className="grid gap-8 lg:grid-cols-2">
            <DashboardSection
              title="Academic year status"
              description="The year currently in use, plus recent years."
              href="/admin/academic-years"
              linkLabel="Manage years"
            >
              {years.length === 0 ? (
                <EmptyState
                  title="No academic years yet"
                  description="Create an academic year to start the school calendar."
                />
              ) : (
                <div className="space-y-4">
                  {activeYear ? (
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <FieldCard>
                        <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                          Active year
                        </dt>
                        <dd className="mt-2 text-lg font-extrabold text-white">
                          {activeYear.yearName}
                        </dd>
                      </FieldCard>
                      <FieldCard>
                        <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                          Dates
                        </dt>
                        <dd className="mt-2 text-sm font-bold text-white">
                          {formatDate(activeYear.startDate)} –{" "}
                          {formatDate(activeYear.endDate)}
                        </dd>
                      </FieldCard>
                    </dl>
                  ) : (
                    <EmptyState
                      title="No active year"
                      description="Activate an academic year so the school calendar has a current term."
                    />
                  )}

                  {otherYears.length > 0 ? (
                    <div className="flex flex-col gap-3 text-left">
                      {otherYears.slice(0, 4).map((year) => (
                        <div
                          key={year.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                        >
                          <div>
                            <p className="text-sm font-bold text-white">
                              {year.yearName}
                            </p>
                            <p className="mt-1 text-xs text-sidebar-muted">
                              {formatDate(year.startDate)} –{" "}
                              {formatDate(year.endDate)}
                            </p>
                          </div>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 ring-1 ring-white/20">
                            {year.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </DashboardSection>

            <DashboardSection
              title="Recent students"
              description="Newest student accounts, most recently created first."
              href="/admin/students"
              linkLabel="View all students"
            >
              {recentStudents.length > 0 ? (
                <div className="flex flex-col gap-3 text-left">
                  {recentStudents.map((student) => (
                    <Link
                      key={student.id}
                      href={`/admin/students/${student.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="mt-1 text-xs text-sidebar-muted">
                          ID {student.studentId}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-sidebar-muted">
                        Manage →
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No students yet"
                  description="New student accounts will appear here after they are added."
                />
              )}
            </DashboardSection>
          </div>
        </>
      ) : null}
    </div>
  );
}
