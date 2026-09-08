/**
 * Teacher attendance page — full CRUD with filters.
 *
 * Records attendance for students in the teacher's subjects.
 * attendancePercentage is auto-calculated server-side (not sent from the client).
 * Duplicate records (same student + subject + date) return 409.
 */
"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  createAttendance,
  deleteAttendance,
  fetchAttendance,
  updateAttendance,
  type Attendance,
  type AttendanceFilters,
  type AttendanceStatus,
  type CreateAttendanceInput,
  type UpdateAttendanceInput,
} from "@/lib/api/attendance";
import { fetchStudents, type StudentSummary } from "@/lib/api/students";
import { fetchSubjects, type SubjectSummary } from "@/lib/api/subjects";
import type { Pagination } from "@/lib/auth/types";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DataTableCard } from "@/components/admin/data-table-card";
import { FormField } from "@/components/admin/form-field";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { formatDate, toDateInputValue } from "@/lib/utils/dates";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

/** Shape of the create/edit form. */
type AttendanceFormState = {
  studentId: string;
  subjectId: string;
  attendanceDate: string;
  attendanceStatus: AttendanceStatus;
};

/** Returns blank form values; dropdown defaults are set when opening create. */
const emptyForm = (
  studentId = "",
  subjectId = ""
): AttendanceFormState => ({
  studentId,
  subjectId,
  attendanceDate: "",
  attendanceStatus: "PRESENT",
});

/** Maps an attendance list row directly to form state (no GET needed for edit). */
function attendanceToForm(record: Attendance): AttendanceFormState {
  return {
    studentId: record.studentId,
    subjectId: record.subjectId,
    attendanceDate: toDateInputValue(record.attendanceDate),
    attendanceStatus: record.attendanceStatus,
  };
}

const STATUS_OPTIONS: AttendanceStatus[] = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
];

export default function TeacherAttendancePage() {
  // Only teachers can access this route.
  useRequireAuth(["TEACHER"]);
  const confirm = useConfirm();

  // --- List state (table + pagination) ---
  const [records, setRecords] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Filter state ---
  const [filterStudent, setFilterStudent] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");

  // --- Modal / form state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AttendanceFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Lookup maps for displaying student/subject names in the table.
  const studentMap = useMemo(() => {
    const map = new Map<string, StudentSummary>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const subjectMap = useMemo(() => {
    const map = new Map<string, SubjectSummary>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  /** Loads all students for the dropdown + table name lookup. */
  const loadStudents = useCallback(async () => {
    try {
      const result = await fetchStudents(1, 100);
      setStudents(result.data);
    } catch {
      setStudents([]);
    }
  }, []);

  /** Loads all subjects for the dropdown + table name lookup. */
  const loadSubjects = useCallback(async () => {
    try {
      const result = await fetchSubjects(1, 100);
      setSubjects(result.data);
    } catch {
      setSubjects([]);
    }
  }, []);

  /** Fetches paginated attendance records with optional filters. */
  const loadAttendance = useCallback(
    async (targetPage: number, filters: AttendanceFilters) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchAttendance(targetPage, 10, filters);
        setRecords(result.data);
        setPagination(result.pagination);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Failed to load attendance."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Load dropdown data once on mount.
  useEffect(() => {
    void loadStudents();
    void loadSubjects();
  }, [loadStudents, loadSubjects]);

  // Current filter values assembled for the fetch.
  const currentFilters = useMemo<AttendanceFilters>(
    () => ({
      studentId: filterStudent || undefined,
      subjectId: filterSubject || undefined,
      fromDate: filterFromDate || undefined,
      toDate: filterToDate || undefined,
    }),
    [filterStudent, filterSubject, filterFromDate, filterToDate]
  );

  // Reload table whenever page or any filter changes.
  useEffect(() => {
    void loadAttendance(page, currentFilters);
  }, [page, currentFilters, loadAttendance]);

  function openCreate() {
    setEditingId(null);
    setForm(
      emptyForm(students[0]?.id ?? "", subjects[0]?.id ?? "")
    );
    setFormError(null);
    setModalOpen(true);
  }

  /** Maps the list row directly to form state (no GET needed). */
  function openEdit(record: Attendance) {
    setFormError(null);
    setEditingId(record.id);
    setForm(attendanceToForm(record));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
  }

  /** Type-safe helper to update a single form field. */
  function updateField<K extends keyof AttendanceFormState>(
    key: K,
    value: AttendanceFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      if (editingId) {
        const payload: UpdateAttendanceInput = {
          studentId: form.studentId,
          subjectId: form.subjectId,
          attendanceDate: form.attendanceDate,
          attendanceStatus: form.attendanceStatus,
        };
        await updateAttendance(editingId, payload);
      } else {
        const payload: CreateAttendanceInput = {
          studentId: form.studentId,
          subjectId: form.subjectId,
          attendanceDate: form.attendanceDate,
          attendanceStatus: form.attendanceStatus,
        };
        await createAttendance(payload);
      }

      toast.success(editingId ? "Attendance updated." : "Attendance recorded.");
      closeModal();
      await loadAttendance(page, currentFilters);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to save attendance.";
      // Surface 409 duplicate errors clearly in the modal.
      if (err instanceof ApiError && err.status === 409) {
        setFormError(
          "Attendance already recorded for this student on this date."
        );
      } else {
        setFormError(message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(record: Attendance) {
    const studentName = studentMap.get(record.studentId);
    const who = studentName
      ? `${studentName.firstName} ${studentName.lastName}`
      : "this student";
    const confirmed = await confirm({
      title: "Delete attendance",
      description: `Delete attendance record for ${who}? This cannot be undone.`,
    });
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteAttendance(record.id);
      toast.success("Attendance record deleted.");
      await loadAttendance(page, currentFilters);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete attendance."
      );
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Teacher Portal"
        title="Attendance"
        description="Record and manage student attendance for your subjects."
      />

      {error ? <Alert>{error}</Alert> : null}

      {/* Filter bar — student, subject, and date range */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Filter by student" htmlFor="filterStudent">
          <Select
            id="filterStudent"
            value={filterStudent}
            onChange={(event) => {
              setPage(1);
              setFilterStudent(event.target.value);
            }}
          >
            <option value="">All students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Filter by subject" htmlFor="filterSubject">
          <Select
            id="filterSubject"
            value={filterSubject}
            onChange={(event) => {
              setPage(1);
              setFilterSubject(event.target.value);
            }}
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.subjectName}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="From date" htmlFor="filterFromDate">
          <Input
            id="filterFromDate"
            type="date"
            value={filterFromDate}
            onChange={(event) => {
              setPage(1);
              setFilterFromDate(event.target.value);
            }}
          />
        </FormField>

        <FormField label="To date" htmlFor="filterToDate">
          <Input
            id="filterToDate"
            type="date"
            value={filterToDate}
            onChange={(event) => {
              setPage(1);
              setFilterToDate(event.target.value);
            }}
          />
        </FormField>
      </div>

      <DataTableCard
        title="Attendance records"
        description="Browse, create, edit, and remove attendance entries."
        action={
          <Button
            type="button"
            onClick={openCreate}
            disabled={students.length === 0 || subjects.length === 0}
          >
            Add attendance
          </Button>
        }
        columns={[
          {
            key: "student",
            header: "Student",
            cell: (row) => {
              const student = studentMap.get(row.studentId);
              return (
                <span className="font-medium text-white">
                  {student
                    ? `${student.firstName} ${student.lastName}`
                    : "—"}
                </span>
              );
            },
          },
          {
            key: "subject",
            header: "Subject",
            cell: (row) => {
              const subject = subjectMap.get(row.subjectId);
              return subject ? subject.subjectName : "—";
            },
          },
          {
            key: "attendanceDate",
            header: "Date",
            cell: (row) => formatDate(row.attendanceDate),
          },
          {
            key: "attendanceStatus",
            header: "Status",
            cell: (row) => row.attendanceStatus,
          },
          {
            key: "attendancePercentage",
            header: "Percentage",
            cell: (row) => `${row.attendancePercentage}%`,
          },
          {
            key: "actions",
            header: "Actions",
            className: "w-40",
            cell: (row) => (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void openEdit(row)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleDelete(row)}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        rows={records}
        isLoading={isLoading}
        emptyMessage="No attendance records yet."
        emptyDescription="Record attendance for students in your subjects."
        emptyAction={
          <Button
            type="button"
            onClick={openCreate}
            disabled={students.length === 0 || subjects.length === 0}
          >
            Add attendance
          </Button>
        }
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />

      {(students.length === 0 || subjects.length === 0) && !isLoading ? (
        <Alert variant="info">
          You need at least one student and one subject before recording
          attendance.
        </Alert>
      ) : null}

      <Modal
        open={modalOpen}
        title={editingId ? "Edit attendance" : "Add attendance"}
        description={
          editingId
            ? "Update this attendance record."
            : "Record attendance for a student."
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Student" htmlFor="studentId">
            <Select
              id="studentId"
              required
              value={form.studentId}
              onChange={(event) => updateField("studentId", event.target.value)}
            >
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Subject" htmlFor="subjectId">
            <Select
              id="subjectId"
              required
              value={form.subjectId}
              onChange={(event) => updateField("subjectId", event.target.value)}
            >
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subjectName}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Date" htmlFor="attendanceDate">
            <Input
              id="attendanceDate"
              type="date"
              required
              value={form.attendanceDate}
              onChange={(event) =>
                updateField("attendanceDate", event.target.value)
              }
            />
          </FormField>

          <FormField label="Status" htmlFor="attendanceStatus">
            <Select
              id="attendanceStatus"
              required
              value={form.attendanceStatus}
              onChange={(event) =>
                updateField(
                  "attendanceStatus",
                  event.target.value as AttendanceStatus
                )
              }
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
          </FormField>

          {formError ? <Alert>{formError}</Alert> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : editingId
                ? "Save changes"
                : "Record attendance"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
