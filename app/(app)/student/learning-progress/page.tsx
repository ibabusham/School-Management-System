"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  fetchLearningProgress,
  fetchProgressNotes,
  type LearningProgress,
  type ProgressNote,
} from "@/lib/api/learning-progress";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/dates";
import { DashboardBarChart } from "@/components/dashboard/dashboard-bar-chart";

export default function StudentLearningProgressPage() {
  const { user } = useRequireAuth(["STUDENT"]);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [notes, setNotes] = useState<ProgressNote[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Load learning progress stats and progress notes in parallel.
    void Promise.all([
      fetchLearningProgress(user.id),
      fetchProgressNotes(user.id, 1, 100),
    ])
      .then(([progressRecord, notesResult]) => {
        setProgress(progressRecord);
        setNotes(notesResult.data);
      })
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
        description="Your academic progress, attendance summary, and teacher notes."
      />

      {error ? <Alert>{error}</Alert> : null}

      {progress ? (
        <>
          <dl className="grid gap-4 sm:grid-cols-2">
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
            <StatCard label="Status" value={progress.learningStatus} />
          </dl>
          <DashboardSection
            title="Progress snapshot"
            description="Averages and attendance together."
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
      ) : (
        <Card className="p-8">
          <p className="text-sm text-sidebar-muted">
            Loading learning progress...
          </p>
        </Card>
      )}

      {/* Read-only notes section — students can view but not edit. */}
      <DashboardSection
        title="Teacher notes"
        description="Observations and recommendations from your teachers."
      >
        {notes.length > 0 ? (
          <div className="flex flex-col gap-4">
            {notes.map((note) => (
              <Card key={note.id} className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    {note.teacher?.name ?? "Teacher"}
                  </span>
                  <span className="text-xs text-sidebar-muted">
                    {note.noteDate ? formatDate(note.noteDate) : "—"}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-bold text-white">Observation: </span>
                    <span className="text-sidebar-muted">
                      {note.noteObservation}
                    </span>
                  </p>
                  <p>
                    <span className="font-bold text-white">Strengths: </span>
                    <span className="text-sidebar-muted">{note.strengths}</span>
                  </p>
                  <p>
                    <span className="font-bold text-white">
                      Areas for improvement:{" "}
                    </span>
                    <span className="text-sidebar-muted">
                      {note.areasForImprovement}
                    </span>
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No teacher notes yet"
            description="When teachers add observations, they will appear here."
          />
        )}
      </DashboardSection>
    </div>
  );
}
