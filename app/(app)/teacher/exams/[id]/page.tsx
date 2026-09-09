"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  fetchExam,
  fetchExamMissingMarks,
  fetchExamTakenMarks,
  submitExamMarks,
} from "@/lib/api/exams";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { GradingPanel } from "@/components/teacher/grading-panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/dates";
import { toast } from "sonner";

export default function TeacherExamDetailPage() {
  useRequireAuth(["TEACHER"]);

  const params = useParams<{ id: string }>();
  const examId = params.id;
  const queryClient = useQueryClient();

  const { data: exam, isPending: isLoading, error } = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => fetchExam(examId),
  });

  const { data: missingData } = useQuery({
    queryKey: ["exam", examId, "missing"],
    queryFn: () => fetchExamMissingMarks(examId),
  });

  const { data: takenData } = useQuery({
    queryKey: ["exam", examId, "taken"],
    queryFn: () => fetchExamTakenMarks(examId),
  });

  const missingStudents = missingData?.data ?? [];
  const takenSubmissions = takenData?.data ?? [];

  const [gradeError, setGradeError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (marks: { studentId: string; score: number }[]) =>
      submitExamMarks(examId, marks),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["exam", examId] });
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
        title={exam?.examName ?? "Exam details"}
        description={
          exam
            ? `${exam.subject?.subjectName ?? "Subject"} · ${formatDate(exam.examDate)}`
            : "Loading exam details..."
        }
        breadcrumbs={[
          { label: "Exams", href: "/teacher/exams" },
          { label: exam?.examName ?? "Details" },
        ]}
      />

      {error ? (
        <Alert>
          {error instanceof ApiError ? error.message : "Failed to load exam."}
        </Alert>
      ) : null}

      {exam ? (
        <dl className="grid gap-8 sm:grid-cols-3">
          <StatCard label="Maximum grade" value={String(exam.maximumGrade)} large />
          <StatCard
            label="Not graded"
            value={String(missingStudents.length)}
            large
          />
          <StatCard label="Graded" value={String(takenSubmissions.length)} large />
        </dl>
      ) : null}

      {exam ? (
        <Card className="p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                Subject
              </dt>
              <dd className="mt-2 text-sm text-white">
                {exam.subject?.subjectName ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-sidebar-muted">
                Exam date
              </dt>
              <dd className="mt-2 text-sm text-white">
                {formatDate(exam.examDate)}
              </dd>
            </div>
          </dl>
        </Card>
      ) : null}

      <GradingPanel
        maxGrade={exam?.maximumGrade ?? 100}
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
