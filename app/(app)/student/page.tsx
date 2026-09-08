"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { fetchLearningProgress } from "@/lib/api/learning-progress";
import { fetchStudent } from "@/lib/api/students";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DashboardBarChart } from "@/components/dashboard/dashboard-bar-chart";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { FieldCard } from "@/components/dashboard/field-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export default function StudentDashboardPage() {
  const { user } = useRequireAuth(["STUDENT"]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<{
    studentId: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);
  const [progress, setProgress] = useState<{
    subjectsAverages: number;
    overallAvreages: number;
    attendencePercentage: number;
    learningStatus: string;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    void Promise.all([
      fetchStudent(user.id),
      fetchLearningProgress(user.id),
    ])
      .then(([student, learningProgress]) => {
        setProfile({
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
        });
        setProgress(learningProgress);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Failed to load dashboard."
        );
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Student Portal"
        title={user ? `Welcome, ${user.name}` : "Dashboard"}
        description="Your academic overview at Shield's School."
      />

      {error ? <Alert>{error}</Alert> : null}

      {isLoading ? (
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
                  label="Overall average"
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
                    { name: "Overall avg", value: progress.overallAvreages },
                    { name: "Attendance", value: progress.attendencePercentage },
                  ]}
                />
              </DashboardSection>
            </>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-2">
            <DashboardSection
              title="Your profile"
              description="Account details at a glance."
              href="/student/profile"
              linkLabel="View profile"
            >
              {profile ? (
                <dl className="grid gap-4 sm:grid-cols-2">
                  <FieldCard>
                    <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                      Student ID
                    </dt>
                    <dd className="mt-2 text-sm font-medium text-white">
                      {profile.studentId}
                    </dd>
                  </FieldCard>
                  <FieldCard>
                    <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                      Email
                    </dt>
                    <dd className="mt-2 text-sm text-white">{profile.email}</dd>
                  </FieldCard>
                  <FieldCard>
                    <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                      Name
                    </dt>
                    <dd className="mt-2 text-sm text-white">
                      {profile.firstName} {profile.lastName}
                    </dd>
                  </FieldCard>
                </dl>
              ) : null}
            </DashboardSection>

            <DashboardSection
              title="Quick links"
              description="Jump to your student pages."
            >
              <div className="flex flex-col gap-3">
                <Link
                  href="/student/profile"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
                >
                  My Profile
                </Link>
                <Link
                  href="/student/learning-progress"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
                >
                  Learning Progress
                </Link>
              </div>
            </DashboardSection>
          </div>
        </>
      )}
    </div>
  );
}
