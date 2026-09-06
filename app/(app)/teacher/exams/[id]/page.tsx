"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  fetchExam,
  fetchExamMissingMarks,
  fetchExamTakenMarks,
  submitExamMarks,
  type ExamDetail,
  type ExamTakenSubmission,
  type StudentMarkCandidate,
} from "@/lib/api/exams";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { GradingPanel } from "@/components/teacher/grading-panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/dates";

export default function TeacherExamDetailPage() {
  useRequireAuth(["TEACHER"]);

  const params = useParams<{ id: string }>();
  const examId = params.id;

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [missingStudents, setMissingStudents] = useState<StudentMarkCandidate[]>(
    []
  );
  const [takenSubmissions, setTakenSubmissions] = useState<ExamTakenSubmission[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [examData, missing, taken] = await Promise.all([
        fetchExam(examId),
        fetchExamMissingMarks(examId),
        fetchExamTakenMarks(examId),
      ]);
      setExam(examData);
      setMissingStudents(missing.data);
      setTakenSubmissions(taken.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load exam.");
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSaveMarks(marks: { studentId: string; score: number }[]) {
    setGradeError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const result = await submitExamMarks(examId, marks);
      setSuccess(result.message);
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
      <div>
        <Link
          href="/teacher/exams"
          className="text-sm font-medium text-primary hover:text-primary-hover"
        >
          ← Back to exams
        </Link>
        <div className="mt-4">
          <PageHeader
            eyebrow="Teacher Portal"
            title={exam?.examName ?? "Exam details"}
            description={
              exam
                ? `${exam.subject?.subjectName ?? "Subject"} · ${formatDate(exam.examDate)}`
                : "Loading exam details..."
            }
          />
        </div>
      </div>

      {error ? <Alert>{error}</Alert> : null}

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
        isSaving={isSaving}
        successMessage={success}
        errorMessage={gradeError}
        onSave={handleSaveMarks}
      />
    </div>
  );
}
