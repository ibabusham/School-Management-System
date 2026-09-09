/**
 * Teacher students list page — browse all students and link to detail pages.
 *
 * Each row links to /teacher/students/[id] where the teacher can view
 * learning progress and manage progress notes.
 */
"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { fetchStudents } from "@/lib/api/students";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DataTableCard } from "@/components/admin/data-table-card";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";

export default function TeacherStudentsPage() {
  // Only teachers can access this route.
  useRequireAuth(["TEACHER"]);

  const [page, setPage] = useState(1);

  const { data, isPending, error } = useQuery({
    queryKey: ["students", page],
    queryFn: () => fetchStudents(page, 10),
    placeholderData: keepPreviousData,
  });

  const students = data?.data ?? [];
  const pagination = data?.pagination ?? null;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Teacher Portal"
        title="Students"
        description="Browse students and view their learning progress and notes."
      />

      {error ? (
        <Alert>
          {error instanceof ApiError ? error.message : "Failed to load students."}
        </Alert>
      ) : null}

      <DataTableCard
        title="All students"
        description="Click a student to view their progress and manage notes."
        columns={[
          {
            key: "studentId",
            header: "Student ID",
            cell: (row) => (
              <span className="font-medium text-white">{row.studentId}</span>
            ),
          },
          {
            key: "name",
            header: "Name",
            cell: (row) => `${row.firstName} ${row.lastName}`,
          },
          {
            key: "actions",
            header: "Actions",
            className: "w-40",
            cell: (row) => (
              <Link
                href={`/teacher/students/${row.id}`}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover"
              >
                Manage
              </Link>
            ),
          },
        ]}
        rows={students}
        isLoading={isPending}
        emptyMessage="No students yet."
        emptyDescription="Students in classes you teach will appear here."
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}
