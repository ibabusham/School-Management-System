"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { fetchStudentDashboard } from "@/lib/api/dashboard";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DashboardBarChart } from "@/components/dashboard/dashboard-bar-chart";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { FieldCard } from "@/components/dashboard/field-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils/dates";

export default function StudentDashboardPage() {
  const { user } = useRequireAuth(["STUDENT"]);
  const { data: dashboard, isPending, error } = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
    enabled: !!user,
  });

  const progress = dashboard?.learningProgress;
  const notes = dashboard?.recentNotes ?? [];
  const subjectAverages = progress?.subjectAverages ?? [];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Student Portal"
        title={user ? `Welcome, ${user.name}` : "Dashboard"}
        description="Your academic overview at Shield's School."
      />

      {error ? (
        <Alert>
          {error instanceof ApiError
            ? error.message
            : "Failed to load dashboard."}
        </Alert>
      ) : null}

      {isPending ? (
        <Card className="p-8">
          <p className="text-sm text-sidebar-muted">Loading dashboard...</p>
        </Card>
      ) : (
        <>
          {progress ? (
            <>
              <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Subject average"
                  value={`${progress.subjectsAverages}%`}
                  large
                />
                <StatCard
                  label="GPA"
                  value={`${progress.overallAvreages}%`}
                  large
                />
                <StatCard
                  label="Attendance"
                  value={`${progress.attendencePercentage}%`}
                  large
                />
                <StatCard
                  label="Learning status"
                  value={progress.learningStatus}
                  hint="Current standing"
                />
              </dl>

              <DashboardSection
                title="Your progress"
                description="Averages and attendance at a glance."
              >
                <DashboardBarChart
                  valueSuffix="%"
                  data={[
                    { name: "Subject avg", value: progress.subjectsAverages },
                    { name: "GPA", value: progress.overallAvreages },
                    { name: "Attendance", value: progress.attendencePercentage },
                  ]}
                />
              </DashboardSection>
            </>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-2">
            <DashboardSection
              title="Recent teacher notes"
              description="Latest observations from your teachers."
              href="/student/learning-progress"
              linkLabel="View all notes"
            >
              {notes.length > 0 ? (
                <div className="flex flex-col gap-4 text-left">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-white">
                          {note.teacher?.name ?? "Teacher"}
                        </span>
                        <span className="text-xs text-sidebar-muted">
                          {note.noteDate ? formatDate(note.noteDate) : "—"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-sidebar-muted">
                        {note.noteObservation}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No teacher notes yet"
                  description="When teachers add observations, they will appear here."
                />
              )}
            </DashboardSection>

            <DashboardSection
              title="Subject averages"
              description="Your average in each subject from graded work."
            >
              {progress && subjectAverages.length > 0 ? (
                <div className="space-y-6">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {subjectAverages.map((subject) => (
                      <FieldCard key={subject.subjectId}>
                        <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                          {subject.subjectName}
                        </dt>
                        <dd className="mt-2 text-2xl font-extrabold text-white">
                          {subject.average}%
                        </dd>
                      </FieldCard>
                    ))}
                  </dl>
                  <DashboardBarChart
                    valueSuffix="%"
                    data={subjectAverages.map((subject) => ({
                      name: subject.subjectName,
                      value: subject.average,
                    }))}
                  />
                </div>
              ) : (
                <EmptyState
                  title="No subject grades yet"
                  description="Averages appear here after exams or assignments are graded."
                />
              )}
            </DashboardSection>
          </div>
        </>
      )}
    </div>
  );
}
