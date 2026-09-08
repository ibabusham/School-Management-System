"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  createStudent,
  deleteStudent,
  fetchStudent,
  fetchStudents,
  updateStudent,
  type CreateStudentInput,
  type Gender,
  type StudentDetail,
  type StudentSummary,
  type UpdateStudentInput,
} from "@/lib/api/students";
import type { Pagination } from "@/lib/auth/types";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DataTableCard } from "@/components/admin/data-table-card";
import { FormField } from "@/components/admin/form-field";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { toDateInputValue } from "@/lib/utils/dates";
import { toast } from "sonner";

type StudentFormState = {
  studentId: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  enrollmentDate: string;
  gender: Gender;
};

const emptyForm = (): StudentFormState => ({
  studentId: "",
  username: "",
  firstName: "",
  lastName: "",
  password: "",
  email: "",
  phoneNumber: "",
  dateOfBirth: "",
  enrollmentDate: "",
  gender: "MALE",
});

function studentToForm(student: StudentDetail): StudentFormState {
  return {
    studentId: String(student.studentId),
    username: "",
    firstName: student.firstName,
    lastName: student.lastName,
    password: "",
    email: student.email,
    phoneNumber: student.phoneNumber ?? "",
    dateOfBirth: toDateInputValue(student.dateOfBirth),
    enrollmentDate: toDateInputValue(student.enrollmentDate),
    gender: student.gender,
  };
}

export default function AdminStudentsPage() {
  useRequireAuth(["ADMIN"]);
  const confirm = useConfirm();

  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  useEffect(() => {
    void loadStudents(page);
  }, [page, loadStudents]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setModalOpen(true);
  }

  async function openEdit(id: string) {
    setFormError(null);
    setEditingId(id);

    try {
      const student = await fetchStudent(id);
      setForm(studentToForm(student));
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load student.");
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
  }

  function updateField<K extends keyof StudentFormState>(
    key: K,
    value: StudentFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      if (editingId) {
        const payload: UpdateStudentInput = {
          studentId: Number(form.studentId),
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phoneNumber: form.phoneNumber || undefined,
          dateOfBirth: form.dateOfBirth,
          enrollmentDate: form.enrollmentDate,
          gender: form.gender,
        };
        await updateStudent(editingId, payload);
      } else {
        const payload: CreateStudentInput = {
          studentId: Number(form.studentId),
          username: form.username,
          firstName: form.firstName,
          lastName: form.lastName,
          password: form.password,
          email: form.email,
          phoneNumber: form.phoneNumber || undefined,
          dateOfBirth: form.dateOfBirth,
          enrollmentDate: form.enrollmentDate,
          gender: form.gender,
        };
        await createStudent(payload);
      }

      toast.success(editingId ? "Student updated." : "Student created.");
      closeModal();
      await loadStudents(page);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save student."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(student: StudentSummary) {
    const confirmed = await confirm({
      title: "Delete student",
      description: `Delete ${student.firstName} ${student.lastName}? This cannot be undone.`,
    });
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteStudent(student.id);
      toast.success("Student deleted.");
      await loadStudents(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete student.");
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Administration"
        title="Students"
        description="Manage enrolled students in the school."
      />

      {error ? <Alert>{error}</Alert> : null}

      <DataTableCard
        title="All students"
        description="Browse, create, edit, and remove student records."
        action={
          <Button type="button" onClick={openCreate}>
            Add student
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
          { key: "firstName", header: "First name", cell: (row) => row.firstName },
          { key: "lastName", header: "Last name", cell: (row) => row.lastName },
          {
            key: "actions",
            header: "Actions",
            className: "w-56",
            cell: (row) => (
              <div className="flex gap-2">
                <Link
                  href={`/admin/students/${row.id}`}
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover"
                >
                  Manage
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void openEdit(row.id)}
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
        rows={students}
        isLoading={isLoading}
        emptyMessage="No students yet."
        emptyDescription="Create the first student account to get started."
        emptyAction={
          <Button type="button" onClick={openCreate}>
            Add student
          </Button>
        }
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />

      <Modal
        open={modalOpen}
        title={editingId ? "Edit student" : "Add student"}
        description={
          editingId
            ? "Update student profile details."
            : "Create a new student account."
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Student ID" htmlFor="studentId">
              <Input
                id="studentId"
                type="number"
                required
                value={form.studentId}
                onChange={(event) => updateField("studentId", event.target.value)}
              />
            </FormField>

            {!editingId ? (
              <FormField label="Username" htmlFor="username">
                <Input
                  id="username"
                  required
                  value={form.username}
                  onChange={(event) => updateField("username", event.target.value)}
                />
              </FormField>
            ) : null}

            <FormField label="First name" htmlFor="firstName">
              <Input
                id="firstName"
                required
                value={form.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
              />
            </FormField>

            <FormField label="Last name" htmlFor="lastName">
              <Input
                id="lastName"
                required
                value={form.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
              />
            </FormField>

            <FormField label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </FormField>

            <FormField label="Phone number" htmlFor="phoneNumber">
              <Input
                id="phoneNumber"
                value={form.phoneNumber}
                onChange={(event) => updateField("phoneNumber", event.target.value)}
              />
            </FormField>

            {!editingId ? (
              <FormField label="Password" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                />
              </FormField>
            ) : null}

            <FormField label="Date of birth" htmlFor="dateOfBirth">
              <Input
                id="dateOfBirth"
                type="date"
                required
                value={form.dateOfBirth}
                onChange={(event) => updateField("dateOfBirth", event.target.value)}
              />
            </FormField>

            <FormField label="Enrollment date" htmlFor="enrollmentDate">
              <Input
                id="enrollmentDate"
                type="date"
                required
                value={form.enrollmentDate}
                onChange={(event) =>
                  updateField("enrollmentDate", event.target.value)
                }
              />
            </FormField>

            <FormField label="Gender" htmlFor="gender">
              <Select
                id="gender"
                value={form.gender}
                onChange={(event) =>
                  updateField("gender", event.target.value as Gender)
                }
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </Select>
            </FormField>
          </div>

          {formError ? <Alert>{formError}</Alert> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Save changes" : "Create student"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
