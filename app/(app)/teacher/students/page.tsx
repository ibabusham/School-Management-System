/**
 * Teacher students list page — browse all students and link to detail pages.
 *
 * Each row links to /teacher/students/[id] where the teacher can view
 * learning progress and manage progress notes.
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { fetchStudents, type StudentSummary } from "@/lib/api/students";
import type { Pagination } from "@/lib/auth/types";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DataTableCard } from "@/components/admin/data-table-card";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function TeacherStudentsPage() {
  // Only teachers can access this route.
  useRequireAuth(["TEACHER"]);

  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Fetches paginated students for the table. */
  const loadStudents = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchStudents(targetPage, 10);
      setStudents(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load students.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload table whenever the current page changes.
  useEffect(() => {
    void loadStudents(page);
  }, [page, loadStudents]);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Teacher Portal"
        title="Students"
        description="Browse students and view their learning progress and notes."
      />

      {error ? <Alert>{error}</Alert> : null}

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
                View
              </Link>
            ),
          },
        ]}
        rows={students}
        isLoading={isLoading}
        emptyMessage="No students found."
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}
