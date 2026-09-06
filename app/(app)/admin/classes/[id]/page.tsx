/**
 * Admin class detail page — view class info and manage enrollment.
 *
 * Assign: POST /api/classes/:id/students with { studentIds }
 * Unassign: DELETE /api/classes/:id/students/:studentId (UUID, not numeric studentId)
 */
"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import {
  assignStudentsToClass,
  fetchClass,
  unassignStudentFromClass,
  type AssignedStudent,
  type ClassDetail,
} from "@/lib/api/classes";
import { fetchStudents, type StudentSummary } from "@/lib/api/students";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DataTableCard } from "@/components/admin/data-table-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";

export default function AdminClassDetailPage() {
  useRequireAuth(["ADMIN"]);

  const params = useParams<{ id: string }>();
  const classId = params.id;

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [allStudents, setAllStudents] = useState<StudentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [classRecord, studentsResult] = await Promise.all([
        fetchClass(classId),
        fetchStudents(1, 100),
      ]);
      setClassData(classRecord);
      setAllStudents(studentsResult.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load class.");
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const enrolledIds = useMemo(
    () => new Set((classData?.students ?? []).map((student) => student.id)),
    [classData]
  );

  const availableStudents = useMemo(
    () => allStudents.filter((student) => !enrolledIds.has(student.id)),
    [allStudents, enrolledIds]
  );

  function openAddModal() {
    setSelectedIds(new Set());
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedIds(new Set());
    setFormError(null);
  }

  function toggleStudent(studentId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  }

  async function handleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      await assignStudentsToClass(classId, [...selectedIds]);
      closeModal();
      await loadData();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to assign students."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUnassign(student: AssignedStudent) {
    const confirmed = window.confirm(
      `Remove ${student.firstName} ${student.lastName} from ${classData?.className}?`
    );
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await unassignStudentFromClass(classId, student.id);
      await loadData();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to remove student."
      );
    }
  }

  const enrolledPagination = {
    page: 1,
    limit: classData?.students.length ?? 0,
    total: classData?.students.length ?? 0,
    totalPages: 1,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title={classData?.className ?? "Class details"}
        description="View class info and assign or remove students."
      />

      {error ? <Alert>{error}</Alert> : null}

      {isLoading ? (
        <Card className="p-8">
          <p className="text-sm text-sidebar-muted">Loading class details...</p>
        </Card>
      ) : classData ? (
        <>
          <DashboardSection
            title="Class details"
            description="Name and linked academic years."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Class name</h3>
                <p className="text-sm text-sidebar-muted">{classData.className}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Academic year</h3>
                <p className="text-sm text-sidebar-muted">
                  {classData.academicYears
                    .map((item) => item.year.yearName)
                    .join(", ") || "—"}
                </p>
              </div>
            </div>
          </DashboardSection>

          <DataTableCard
            title="Enrolled students"
            description="Students currently assigned to this class."
            action={
              <Button
                type="button"
                onClick={openAddModal}
                disabled={availableStudents.length === 0}
              >
                Add students
              </Button>
            }
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
                className: "w-32",
                cell: (row) => (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void handleUnassign(row)}
                  >
                    Remove
                  </Button>
                ),
              },
            ]}
            rows={classData.students}
            isLoading={false}
            emptyMessage="No students enrolled in this class."
            pagination={enrolledPagination}
            page={1}
            onPageChange={() => undefined}
          />

          {availableStudents.length === 0 ? (
            <Alert variant="info">
              Every listed student is already enrolled, or no students exist yet.
            </Alert>
          ) : null}
        </>
      ) : null}

      <Modal
        open={modalOpen}
        title="Add students"
        description="Select students to assign to this class."
        onClose={closeModal}
      >
        <form onSubmit={handleAssign} className="space-y-4">
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
            {availableStudents.map((student) => (
              <label
                key={student.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-surface"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(student.id)}
                  onChange={() => toggleStudent(student.id)}
                />
                <span>
                  {student.firstName} {student.lastName}{" "}
                  <span className="text-muted-foreground">
                    ({student.studentId})
                  </span>
                </span>
              </label>
            ))}
          </div>

          {formError ? <Alert>{formError}</Alert> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || selectedIds.size === 0}>
              {isSaving ? "Assigning..." : "Assign students"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
