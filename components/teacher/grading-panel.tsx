/**
 * Teacher grading UI for exams and assignments.
 *
 * Shows two tables:
 * 1. Students without a mark yet (missingStudents)
 * 2. Students already graded (takenSubmissions)
 *
 * Parent page fetches data and passes onSave to POST marks to the API.
 * Score state is local until the teacher clicks "Save marks".
 */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

type StudentRow = {
  id: string;
  studentId: number;
  firstName: string;
  lastName: string;
};

type TakenRow = {
  studentId: string;
  firstName: string;
  lastName: string;
  score: number;
};

export function GradingPanel({
  maxGrade,
  missingStudents,
  takenSubmissions,
  isLoading,
  isSaving,
  errorMessage,
  onSave,
}: {
  maxGrade: number;
  missingStudents: StudentRow[];
  takenSubmissions: TakenRow[];
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  onSave: (marks: { studentId: string; score: number }[]) => Promise<void>;
}) {
  // Map of studentId → score string (controlled inputs)
  const [scores, setScores] = useState<Record<string, string>>({});

  // Pre-fill inputs from existing graded submissions
  const initialScores = useMemo(() => {
    const next: Record<string, string> = {};
    for (const submission of takenSubmissions) {
      next[submission.studentId] = String(submission.score);
    }
    return next;
  }, [takenSubmissions]);

  useEffect(() => {
    setScores(initialScores);
  }, [initialScores]);

  function updateScore(studentId: string, value: string) {
    setScores((current) => ({ ...current, [studentId]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const studentIds = [
      ...missingStudents.map((student) => student.id),
      ...takenSubmissions.map((submission) => submission.studentId),
    ];

    // Collect only rows where the teacher entered a score
    const marks = studentIds
      .map((studentId) => {
        const raw = scores[studentId]?.trim();
        if (!raw) {
          return null;
        }
        const score = Number(raw);
        if (Number.isNaN(score)) {
          return null;
        }
        return { studentId, score };
      })
      .filter((mark): mark is { studentId: string; score: number } => mark !== null);

    if (marks.length === 0) {
      return;
    }

    await onSave(marks);
  }

  if (isLoading) {
    return (
      <DashboardSection title="Grade students" description="Loading class roster...">
        <p className="text-sm text-sidebar-muted">Loading marks...</p>
      </DashboardSection>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
      {errorMessage ? <Alert>{errorMessage}</Alert> : null}

      <DashboardSection
        title="Not yet graded"
        description="Students in this class without a mark yet."
      >
        {missingStudents.length === 0 ? (
          <p className="text-sm text-sidebar-muted">
            All students in the class have been graded.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-sidebar-muted">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-sidebar-muted">
                    Student ID
                  </th>
                  <th className="w-32 px-4 py-3 text-left font-medium text-sidebar-muted">
                    Score (max {maxGrade})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {missingStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-4 py-3">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-4 py-3 text-sidebar-muted">
                      {student.studentId}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min={0}
                        max={maxGrade}
                        placeholder="—"
                        value={scores[student.id] ?? ""}
                        onChange={(event) =>
                          updateScore(student.id, event.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Graded"
        description="Update scores for students who already have marks."
      >
        {takenSubmissions.length === 0 ? (
          <p className="text-sm text-sidebar-muted">No grades recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-sidebar-muted">
                    Student
                  </th>
                  <th className="w-32 px-4 py-3 text-left font-medium text-sidebar-muted">
                    Score (max {maxGrade})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {takenSubmissions.map((submission) => (
                  <tr key={submission.studentId}>
                    <td className="px-4 py-3">
                      {submission.firstName} {submission.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min={0}
                        max={maxGrade}
                        value={scores[submission.studentId] ?? ""}
                        onChange={(event) =>
                          updateScore(submission.studentId, event.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving marks..." : "Save marks"}
        </Button>
      </div>
    </form>
  );
}
