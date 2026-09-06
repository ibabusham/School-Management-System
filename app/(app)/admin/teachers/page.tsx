"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  createTeacher,
  deleteTeacher,
  fetchTeacher,
  fetchTeachers,
  updateTeacher,
  type CreateTeacherInput,
  type TeacherDetail,
  type TeacherSummary,
  type UpdateTeacherInput,
} from "@/lib/api/teachers";
import type { Pagination } from "@/lib/auth/types";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DataTableCard } from "@/components/admin/data-table-card";
import { FormField } from "@/components/admin/form-field";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

type TeacherFormState = {
  username: string;
  employId: string;
  name: string;
  password: string;
  email: string;
  phoneNumber: string;
  specilization: string;
};

const emptyForm = (): TeacherFormState => ({
  username: "",
  employId: "",
  name: "",
  password: "",
  email: "",
  phoneNumber: "",
  specilization: "",
});

function teacherToForm(teacher: TeacherDetail): TeacherFormState {
  return {
    username: "",
    employId: String(teacher.employId),
    name: teacher.name,
    password: "",
    email: teacher.email,
    phoneNumber: teacher.phoneNumber,
    specilization: teacher.specilization,
  };
}

export default function AdminTeachersPage() {
  useRequireAuth(["ADMIN"]);

  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TeacherFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadTeachers = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchTeachers(targetPage, 10);
      setTeachers(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load teachers.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeachers(page);
  }, [page, loadTeachers]);

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
      const teacher = await fetchTeacher(id);
      setForm(teacherToForm(teacher));
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load teacher.");
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
  }

  function updateField<K extends keyof TeacherFormState>(
    key: K,
    value: TeacherFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      if (editingId) {
        const payload: UpdateTeacherInput = {
          name: form.name,
          email: form.email,
          phoneNumber: form.phoneNumber,
          specilization: form.specilization,
        };
        await updateTeacher(editingId, payload);
      } else {
        const payload: CreateTeacherInput = {
          username: form.username,
          employId: Number(form.employId),
          name: form.name,
          password: form.password,
          email: form.email,
          phoneNumber: form.phoneNumber,
          specilization: form.specilization,
        };
        await createTeacher(payload);
      }

      closeModal();
      await loadTeachers(page);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save teacher."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(teacher: TeacherSummary) {
    const confirmed = window.confirm(`Delete teacher ${teacher.name}?`);
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteTeacher(teacher.id);
      await loadTeachers(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete teacher.");
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Administration"
        title="Teachers"
        description="Manage teacher accounts and profiles."
      />

      {error ? <Alert>{error}</Alert> : null}

      <DataTableCard
        title="All teachers"
        description="Browse, create, edit, and remove teacher records."
        action={
          <Button type="button" onClick={openCreate}>
            Add teacher
          </Button>
        }
        columns={[
          {
            key: "employId",
            header: "Employee ID",
            cell: (row) => (
              <span className="font-medium text-white">{row.employId}</span>
            ),
          },
          { key: "name", header: "Name", cell: (row) => row.name },
          {
            key: "specilization",
            header: "Specialization",
            cell: (row) => row.specilization,
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
        rows={teachers}
        isLoading={isLoading}
        emptyMessage="No teachers found."
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />

      <Modal
        open={modalOpen}
        title={editingId ? "Edit teacher" : "Add teacher"}
        description={
          editingId
            ? "Update teacher profile details."
            : "Create a new teacher account."
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Employee ID" htmlFor="employId">
              <Input
                id="employId"
                type="number"
                required
                disabled={Boolean(editingId)}
                value={form.employId}
                onChange={(event) => updateField("employId", event.target.value)}
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

            <FormField label="Full name" htmlFor="name">
              <Input
                id="name"
                required
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
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
                required
                value={form.phoneNumber}
                onChange={(event) => updateField("phoneNumber", event.target.value)}
              />
            </FormField>

            <FormField label="Specialization" htmlFor="specilization">
              <Input
                id="specilization"
                required
                value={form.specilization}
                onChange={(event) =>
                  updateField("specilization", event.target.value)
                }
              />
            </FormField>

            {!editingId ? (
              <FormField label="Password" htmlFor="password" className="sm:col-span-2">
                <Input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                />
              </FormField>
            ) : null}
          </div>

          {formError ? <Alert>{formError}</Alert> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Save changes" : "Create teacher"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
