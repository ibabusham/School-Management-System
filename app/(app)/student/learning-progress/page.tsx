"use client";

import { useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api/client";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

type LearningProgressResponse = {
  learningProgress: {
    subjectsAverages: number;
    overallAvreages: number;
    attendencePercentage: number;
    learningStatus: string;
  };
};

export default function StudentLearningProgressPage() {
  const { user } = useRequireAuth(["STUDENT"]);
  const [progress, setProgress] = useState<
    LearningProgressResponse["learningProgress"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    void apiRequest<LearningProgressResponse>(
      `/api/students/${user.id}/learningProgress?page=1&limit=1`
    )
      .then((data) => setProgress(data.learningProgress))
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Failed to load learning progress."
        );
      });
  }, [user]);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Student Portal"
        title="Learning Progress"
        description="Your academic progress and attendance summary."
      />

      {error ? <Alert>{error}</Alert> : null}

      {progress ? (
        <dl className="grid gap-4 sm:grid-cols-2">
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
          <StatCard label="Status" value={progress.learningStatus} />
        </dl>
      ) : (
        <Card className="p-8">
          <p className="text-sm text-sidebar-muted">
            Loading learning progress...
          </p>
        </Card>
      )}
    </div>
  );
}
