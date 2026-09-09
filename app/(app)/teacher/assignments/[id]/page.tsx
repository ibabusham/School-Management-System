"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAssignment,
  fetchAssignmentMissingMarks,
  fetchAssignmentTakenMarks,
  submitAssignmentMarks,
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
  const queryClient = useQueryClient();

  const { data: assignment, isPending: isLoading, error } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => fetchAssignment(assignmentId),
  });

  const { data: missingData } = useQuery({
    queryKey: ["assignment", assignmentId, "missing"],
    queryFn: () => fetchAssignmentMissingMarks(assignmentId),
  });

  const { data: takenData } = useQuery({
    queryKey: ["assignment", assignmentId, "taken"],
    queryFn: () => fetchAssignmentTakenMarks(assignmentId),
  });

  const missingStudents = missingData?.data ?? [];
  const takenSubmissions = takenData?.data ?? [];

  const [gradeError, setGradeError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (marks: { studentId: string; score: number }[]) =>
      submitAssignmentMarks(assignmentId, marks),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
    },
  });

  async function handleSaveMarks(marks: { studentId: string; score: number }[]) {
    setGradeError(null);

    try {
      await saveMutation.mutateAsync(marks);
    } catch (err) {
      setGradeError(
        err instanceof ApiError ? err.message : "Failed to save marks."
      );
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

      {error ? (
        <Alert>
          {error instanceof ApiError ? error.message : "Failed to load assignment."}
        </Alert>
      ) : null}

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
        isSaving={saveMutation.isPending}
        errorMessage={gradeError}
        onSave={handleSaveMarks}
      />
    </div>
  );
}
