/**
 * Admin subject detail — class/teacher assignment plus related lessons, exams, and assignments.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchAssignments, type AssignmentSummary } from "@/lib/api/assignments";
import { ApiError } from "@/lib/api/client";
import { fetchExams, type ExamSummary } from "@/lib/api/exams";
import { fetchLessons, type LessonSummary } from "@/lib/api/lessons";
import { fetchSubject, type SubjectDetail } from "@/lib/api/subjects";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DataTableCard } from "@/components/admin/data-table-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/dates";

const emptyPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

export default function AdminSubjectDetailPage() {
  useRequireAuth(["ADMIN"]);

  const params = useParams<{ id: string }>();
  const subjectId = params.id;

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [subjectRecord, lessonsResult, examsResult, assignmentsResult] =
        await Promise.all([
          fetchSubject(subjectId),
          fetchLessons(1, 10, subjectId),
          fetchExams(1, 10, subjectId),
          fetchAssignments(1, 10, subjectId),
        ]);

      setSubject(subjectRecord);
      setLessons(lessonsResult.data);
      setExams(examsResult.data);
      setAssignments(assignmentsResult.data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load subject."
      );
    } finally {
      setIsLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Administration"
        title={subject?.subjectName ?? "Subject details"}
        description="View this subject’s class, teacher, lessons, exams, and assignments."
        breadcrumbs={[
          { label: "Subjects", href: "/admin/subjects" },
          { label: subject?.subjectName ?? "Details" },
        ]}
      />

      {error ? <Alert>{error}</Alert> : null}

      {isLoading ? (
        <Card className="p-8">
          <p className="text-sm text-sidebar-muted">Loading subject details...</p>
        </Card>
      ) : subject ? (
        <>
          <DashboardSection
            title="Subject details"
            description="Assignment and description."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Code</h3>
                <p className="text-sm text-sidebar-muted">{subject.subjectCode}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Class</h3>
                <p className="text-sm text-sidebar-muted">
                  {subject.class?.className ?? "—"}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Teacher</h3>
                <p className="text-sm text-sidebar-muted">
                  {subject.teacher?.name ?? "—"}
                </p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <h3 className="text-sm font-medium text-white">Description</h3>
                <p className="text-sm text-sidebar-muted">{subject.description}</p>
              </div>
            </div>
          </DashboardSection>

          <DataTableCard
            title="Lessons"
            description="Lessons scheduled for this subject."
            columns={[
              {
                key: "lessonTitle",
                header: "Title",
                cell: (row) => (
                  <span className="font-medium text-white">{row.lessonTitle}</span>
                ),
              },
              {
                key: "lessonDate",
                header: "Date",
                cell: (row) => formatDate(row.lessonDate),
              },
            ]}
            rows={lessons}
            isLoading={false}
            emptyMessage="No lessons yet."
            emptyDescription="Lessons for this subject will appear here."
            pagination={{
              ...emptyPagination,
              total: lessons.length,
              limit: lessons.length || 10,
            }}
            page={1}
            onPageChange={() => undefined}
          />

          <DataTableCard
            title="Exams"
            description="Exams for this subject."
            columns={[
              {
                key: "examName",
                header: "Exam",
                cell: (row) => (
                  <span className="font-medium text-white">{row.examName}</span>
                ),
              },
              {
                key: "examDate",
                header: "Date",
                cell: (row) => formatDate(row.examDate),
              },
            ]}
            rows={exams}
            isLoading={false}
            emptyMessage="No exams yet."
            emptyDescription="Exams for this subject will appear here."
            pagination={{
              ...emptyPagination,
              total: exams.length,
              limit: exams.length || 10,
            }}
            page={1}
            onPageChange={() => undefined}
          />

          <DataTableCard
            title="Assignments"
            description="Assignments for this subject."
            columns={[
              {
                key: "assignmentTitle",
                header: "Title",
                cell: (row) => (
                  <span className="font-medium text-white">
                    {row.assignmentTitle}
                  </span>
                ),
              },
              {
                key: "dueDate",
                header: "Due date",
                cell: (row) => formatDate(row.dueDate),
              },
            ]}
            rows={assignments}
            isLoading={false}
            emptyMessage="No assignments yet."
            emptyDescription="Assignments for this subject will appear here."
            pagination={{
              ...emptyPagination,
              total: assignments.length,
              limit: assignments.length || 10,
            }}
            page={1}
            onPageChange={() => undefined}
          />
        </>
      ) : null}
    </div>
  );
}
