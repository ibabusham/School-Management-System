/**
 * Teacher attendance page — full CRUD with filters.
 *
 * Records attendance for students in the teacher's subjects.
 * attendancePercentage is auto-calculated server-side (not sent from the client).
 * Duplicate records (same student + subject + date) return 409.
 */
"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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
import { fetchStudents } from "@/lib/api/students";
import { fetchSubjects } from "@/lib/api/subjects";
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
  const queryClient = useQueryClient();

  // --- List state (table + pagination) ---
  const [page, setPage] = useState(1);
  const [pageError, setPageError] = useState<string | null>(null);

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

  const { data, isPending, error } = useQuery({
    queryKey: ["attendance", page, currentFilters],
    queryFn: () => fetchAttendance(page, 10, currentFilters),
    placeholderData: keepPreviousData,
  });

  const records = data?.data ?? [];
  const pagination = data?.pagination ?? null;

  const { data: studentsData } = useQuery({
    queryKey: ["students", "all"],
    queryFn: () => fetchStudents(1, 100),
    staleTime: 5 * 60_000,
  });
  const students = studentsData?.data ?? [];

  const { data: subjectsData } = useQuery({
    queryKey: ["subjects", "all"],
    queryFn: () => fetchSubjects(1, 100),
    staleTime: 5 * 60_000,
  });
  const subjects = subjectsData?.data ?? [];

  // Lookup maps for displaying student/subject names in the table.
  const studentMap = useMemo(() => {
    const map = new Map<string, typeof students[number]>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const subjectMap = useMemo(() => {
    const map = new Map<string, typeof subjects[number]>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateAttendanceInput | UpdateAttendanceInput) => {
      if (editingId) {
        return updateAttendance(editingId, payload as UpdateAttendanceInput);
      }
      return createAttendance(payload as CreateAttendanceInput);
    },
    onSuccess: () => {
      toast.success(editingId ? "Attendance updated." : "Attendance recorded.");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAttendance,
    onSuccess: () => {
      toast.success("Attendance record deleted.");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });

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

    try {
      if (editingId) {
        const payload: UpdateAttendanceInput = {
          studentId: form.studentId,
          subjectId: form.subjectId,
          attendanceDate: form.attendanceDate,
          attendanceStatus: form.attendanceStatus,
        };
        await saveMutation.mutateAsync(payload);
      } else {
        const payload: CreateAttendanceInput = {
          studentId: form.studentId,
          subjectId: form.subjectId,
          attendanceDate: form.attendanceDate,
          attendanceStatus: form.attendanceStatus,
        };
        await saveMutation.mutateAsync(payload);
      }
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

    setPageError(null);

    try {
      await deleteMutation.mutateAsync(record.id);
    } catch (err) {
      setPageError(
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

      {pageError ? <Alert>{pageError}</Alert> : null}
      {error ? (
        <Alert>
          {error instanceof ApiError ? error.message : "Failed to load attendance."}
        </Alert>
      ) : null}

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
        isLoading={isPending}
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

      {(students.length === 0 || subjects.length === 0) && !isPending ? (
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

          <FormField label="Status">
            <div
              role="radiogroup"
              aria-label="Attendance status"
              className="grid grid-cols-2 gap-2"
            >
              {STATUS_OPTIONS.map((status) => {
                const selected = form.attendanceStatus === status;
                return (
                  <label
                    key={status}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-bold transition-colors ${
                      selected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-surface text-foreground hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="attendanceStatus"
                      value={status}
                      checked={selected}
                      required
                      className="h-4 w-4 accent-primary"
                      onChange={() =>
                        updateField("attendanceStatus", status)
                      }
                    />
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </label>
                );
              })}
            </div>
          </FormField>

          {formError ? <Alert>{formError}</Alert> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
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
