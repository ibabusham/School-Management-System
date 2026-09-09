/**
 * Admin subject detail — class/teacher assignment plus related lessons, exams, and assignments.
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { fetchAssignments } from "@/lib/api/assignments";
import { ApiError } from "@/lib/api/client";
import { fetchExams } from "@/lib/api/exams";
import { fetchLessons } from "@/lib/api/lessons";
import { fetchSubject } from "@/lib/api/subjects";
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

  const { data: subject, isPending: isLoading, error } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: () => fetchSubject(subjectId),
  });

  const { data: lessonsData } = useQuery({
    queryKey: ["lessons", 1, subjectId],
    queryFn: () => fetchLessons(1, 10, subjectId),
  });

  const { data: examsData } = useQuery({
    queryKey: ["exams", 1, subjectId],
    queryFn: () => fetchExams(1, 10, subjectId),
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ["assignments", 1, subjectId],
    queryFn: () => fetchAssignments(1, 10, subjectId),
  });

  const lessons = lessonsData?.data ?? [];
  const exams = examsData?.data ?? [];
  const assignments = assignmentsData?.data ?? [];

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

      {error ? (
        <Alert>
          {error instanceof ApiError ? error.message : "Failed to load subject."}
        </Alert>
      ) : null}

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
