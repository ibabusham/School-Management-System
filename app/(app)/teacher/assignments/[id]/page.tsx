"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  fetchAssignment,
  fetchAssignmentMissingMarks,
  fetchAssignmentTakenMarks,
  submitAssignmentMarks,
  type AssignmentDetail,
  type AssignmentTakenSubmission,
  type StudentMarkCandidate,
} from "@/lib/api/assignments";
import { ApiError } from "@/lib/api/client";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { GradingPanel } from "@/components/teacher/grading-panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/dates";
import { toast } from "sonner";

export default function TeacherAssignmentDetailPage() {
  useRequireAuth(["TEACHER"]);

  const params = useParams<{ id: string }>();
  const assignmentId = params.id;

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [missingStudents, setMissingStudents] = useState<StudentMarkCandidate[]>(
    []
  );
  const [takenSubmissions, setTakenSubmissions] = useState<
    AssignmentTakenSubmission[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [assignmentData, missing, taken] = await Promise.all([
        fetchAssignment(assignmentId),
        fetchAssignmentMissingMarks(assignmentId),
        fetchAssignmentTakenMarks(assignmentId),
      ]);
      setAssignment(assignmentData);
      setMissingStudents(missing.data);
      setTakenSubmissions(taken.data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load assignment."
      );
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSaveMarks(marks: { studentId: string; score: number }[]) {
    setGradeError(null);
    setIsSaving(true);

    try {
      const result = await submitAssignmentMarks(assignmentId, marks);
      toast.success(result.message);
      await loadData();
    } catch (err) {
      setGradeError(
        err instanceof ApiError ? err.message : "Failed to save marks."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Teacher Portal"
        title={assignment?.assignmentTitle ?? "Assignment details"}
        description={
          assignment
            ? `${assignment.subject?.subjectName ?? "Subject"} · Due ${formatDate(assignment.dueDate)}`
            : "Loading assignment details..."
        }
        breadcrumbs={[
          { label: "Assignments", href: "/teacher/assignments" },
          { label: assignment?.assignmentTitle ?? "Details" },
        ]}
      />

      {error ? <Alert>{error}</Alert> : null}

      {assignment ? (
        <dl className="grid gap-8 sm:grid-cols-3">
          <StatCard
            label="Maximum grade"
            value={String(assignment.maximumGrade)}
            large
          />
          <StatCard
            label="Not graded"
            value={String(missingStudents.length)}
            large
          />
          <StatCard
            label="Graded"
            value={String(takenSubmissions.length)}
            large
          />
        </dl>
      ) : null}

      {assignment ? (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-sm font-bold text-white">
              Description
            </h2>
            <p className="mt-2 text-sm text-white">
              {assignment.assignmentDescription}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              Submission instructions
            </h2>
            <p className="mt-2 text-sm text-white">
              {assignment.submissionInstructions}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              Attachment
            </h2>
            <a
              href={assignment.attachment}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-primary hover:text-primary-hover"
            >
              {assignment.attachment}
            </a>
          </div>
        </Card>
      ) : null}

      <GradingPanel
        maxGrade={assignment?.maximumGrade ?? 100}
        missingStudents={missingStudents}
        takenSubmissions={takenSubmissions}
        isLoading={isLoading}
        isSaving={isSaving}
        errorMessage={gradeError}
        onSave={handleSaveMarks}
      />
    </div>
  );
}
