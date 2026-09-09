"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { fetchTeacherDashboard } from "@/lib/api/dashboard";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DashboardBarChart } from "@/components/dashboard/dashboard-bar-chart";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/dates";

export default function TeacherDashboardPage() {
  const { user } = useRequireAuth(["TEACHER"]);
  const { data: dashboard, isPending: isLoading, error } = useQuery({
    queryKey: ["dashboard", "teacher"],
    queryFn: fetchTeacherDashboard,
    enabled: !!user,
  });

  const subjectCount = dashboard?.counts.subjects ?? 0;
  const examCount = dashboard?.counts.exams ?? 0;
  const assignmentCount = dashboard?.counts.assignments ?? 0;
  const subjects = dashboard?.subjects ?? [];
  const exams = dashboard?.recentExams ?? [];
  const assignments = dashboard?.recentAssignments ?? [];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Teacher Portal"
        title={user ? `Welcome, ${user.name}` : "Dashboard"}
        description="Overview of your subjects, exams, and assignments."
      />

      {error ? (
        <Alert>
          {error instanceof ApiError ? error.message : "Failed to load dashboard."}
        </Alert>
      ) : null}

      {isLoading ? (
        <Card className="p-8">
          <p className="text-sm text-sidebar-muted">Loading dashboard...</p>
        </Card>
      ) : (
        <>
          <dl className="grid gap-8 sm:grid-cols-3">
            <StatCard label="Subjects" value={String(subjectCount)} large />
            <StatCard label="Exams" value={String(examCount)} large />
            <StatCard
              label="Assignments"
              value={String(assignmentCount)}
              large
            />
          </dl>

          <DashboardSection
            title="Your workload"
            description="Subjects, exams, and assignments assigned to you."
          >
            <DashboardBarChart
              data={[
                { name: "Subjects", value: subjectCount },
                { name: "Exams", value: examCount },
                { name: "Assignments", value: assignmentCount },
              ]}
            />
          </DashboardSection>

          <DashboardSection
            title="Your subjects"
            description="Classes and subjects assigned to you."
            href="/teacher/exams"
            linkLabel="Manage exams"
          >
            {subjects.length === 0 ? (
              <EmptyState
                title="No subjects yet"
                description="Subjects assigned to you will show up here."
              />
            ) : (
              <ul className="divide-y divide-white/10 rounded-lg border border-white/10">
                {subjects.map((subject) => (
                  <li
                    key={subject.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-white">
                      {subject.subjectName}
                    </span>
                    <span className="text-sidebar-muted">
                      {subject.subjectCode}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>

          <div className="grid gap-8 lg:grid-cols-2">
            <DashboardSection
              title="Recent exams"
              description="Latest exams across your subjects."
              href="/teacher/exams"
              linkLabel="View all"
            >
              {exams.length === 0 ? (
                <EmptyState
                  title="No exams yet"
                  description="Create an exam to start grading students."
                  action={
                    <Link
                      href="/teacher/exams"
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"
                    >
                      Add exam
                    </Link>
                  }
                />
              ) : (
                <ul className="divide-y divide-white/10 rounded-lg border border-white/10">
                  {exams.map((exam) => (
                    <li key={exam.id}>
                      <Link
                        href={`/teacher/exams/${exam.id}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-background"
                      >
                        <span className="font-medium text-white">
                          {exam.examName}
                        </span>
                        <span className="text-sidebar-muted">
                          {formatDate(exam.examDate)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardSection>

            <DashboardSection
              title="Recent assignments"
              description="Latest assignments and due dates."
              href="/teacher/assignments"
              linkLabel="View all"
            >
              {assignments.length === 0 ? (
                <EmptyState
                  title="No assignments yet"
                  description="Create an assignment for one of your subjects."
                  action={
                    <Link
                      href="/teacher/assignments"
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"
                    >
                      Add assignment
                    </Link>
                  }
                />
              ) : (
                <ul className="divide-y divide-white/10 rounded-lg border border-white/10">
                  {assignments.map((assignment) => (
                    <li key={assignment.id}>
                      <Link
                        href={`/teacher/assignments/${assignment.id}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-background"
                      >
                        <span className="font-medium text-white">
                          {assignment.assignmentTitle}
                        </span>
                        <span className="text-sidebar-muted">
                          {formatDate(assignment.dueDate)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardSection>
          </div>
        </>
      )}
    </div>
  );
}
