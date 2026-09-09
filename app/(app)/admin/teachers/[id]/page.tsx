/**
 * Admin teacher detail — profile plus subjects assigned to this teacher.
 */
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { fetchSubjects } from "@/lib/api/subjects";
import { fetchTeacher } from "@/lib/api/teachers";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DataTableCard } from "@/components/admin/data-table-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export default function AdminTeacherDetailPage() {
  useRequireAuth(["ADMIN"]);

  const params = useParams<{ id: string }>();
  const teacherId = params.id;

  const { data: teacher, isPending: isLoading, error } = useQuery({
    queryKey: ["teacher", teacherId],
    queryFn: () => fetchTeacher(teacherId),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ["subjects", "all"],
    queryFn: () => fetchSubjects(1, 100),
    staleTime: 5 * 60_000,
  });

  const subjects = useMemo(
    () =>
      (subjectsData?.data ?? []).filter(
        (subject) => subject.teacherId === teacherId
      ),
    [subjectsData, teacherId]
  );

  const pagination = useMemo(
    () => ({
      page: 1,
      limit: subjects.length || 10,
      total: subjects.length,
      totalPages: 1,
    }),
    [subjects.length]
  );

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Administration"
        title={teacher?.name ?? "Teacher details"}
        description="View this teacher’s profile and assigned subjects."
        breadcrumbs={[
          { label: "Teachers", href: "/admin/teachers" },
          { label: teacher?.name ?? "Details" },
        ]}
      />

      {error ? (
        <Alert>
          {error instanceof ApiError ? error.message : "Failed to load teacher."}
        </Alert>
      ) : null}

      {isLoading ? (
        <Card className="p-8">
          <p className="text-sm text-sidebar-muted">Loading teacher details...</p>
        </Card>
      ) : teacher ? (
        <>
          <DashboardSection
            title="Teacher profile"
            description="Account and contact details."
          >
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Employee ID</h3>
                <p className="text-sm text-sidebar-muted">{teacher.employId}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Specialization</h3>
                <p className="text-sm text-sidebar-muted">
                  {teacher.specilization}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Email</h3>
                <p className="text-sm text-sidebar-muted">{teacher.email}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Phone</h3>
                <p className="text-sm text-sidebar-muted">
                  {teacher.phoneNumber || "—"}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Status</h3>
                <p className="text-sm text-sidebar-muted">
                  {teacher.accountStatus ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </DashboardSection>

          <DataTableCard
            title="Assigned subjects"
            description="Subjects this teacher is linked to."
            columns={[
              {
                key: "subjectName",
                header: "Subject",
                cell: (row) => (
                  <span className="font-medium text-white">{row.subjectName}</span>
                ),
              },
              {
                key: "subjectCode",
                header: "Code",
                cell: (row) => row.subjectCode,
              },
              {
                key: "className",
                header: "Class",
                cell: (row) => row.className ?? "—",
              },
              {
                key: "actions",
                header: "Actions",
                className: "w-32",
                cell: (row) => (
                  <Link
                    href={`/admin/subjects/${row.id}`}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover"
                  >
                    Manage
                  </Link>
                ),
              },
            ]}
            rows={subjects}
            isLoading={false}
            emptyMessage="No subjects assigned yet."
            emptyDescription="Subjects assigned to this teacher will appear here."
            pagination={pagination}
            page={1}
            onPageChange={() => undefined}
          />
        </>
      ) : null}
    </div>
  );
}
