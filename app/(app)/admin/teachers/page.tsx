"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DataTableCard } from "@/components/admin/data-table-card";
import { FormField } from "@/components/admin/form-field";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

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
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TeacherFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["teachers", page],
    queryFn: () => fetchTeachers(page, 10),
    placeholderData: keepPreviousData,
  });

  const teachers = data?.data ?? [];
  const pagination = data?.pagination ?? null;

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateTeacherInput | UpdateTeacherInput) => {
      if (editingId) {
        return updateTeacher(editingId, payload as UpdateTeacherInput);
      }
      return createTeacher(payload as CreateTeacherInput);
    },
    onSuccess: () => {
      toast.success(editingId ? "Teacher updated." : "Teacher created.");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeacher,
    onSuccess: () => {
      toast.success("Teacher deleted.");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });

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
      setPageError(err instanceof ApiError ? err.message : "Failed to load teacher.");
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

    try {
      if (editingId) {
        const payload: UpdateTeacherInput = {
          name: form.name,
          email: form.email,
          phoneNumber: form.phoneNumber,
          specilization: form.specilization,
        };
        await saveMutation.mutateAsync(payload);
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
        await saveMutation.mutateAsync(payload);
      }
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save teacher."
      );
    }
  }

  async function handleDelete(teacher: TeacherSummary) {
    const confirmed = await confirm({
      title: "Delete teacher",
      description: `Delete teacher ${teacher.name}? This cannot be undone.`,
    });
    if (!confirmed) {
      return;
    }

    setPageError(null);

    try {
      await deleteMutation.mutateAsync(teacher.id);
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : "Failed to delete teacher.");
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Administration"
        title="Teachers"
        description="Manage teacher accounts and profiles."
      />

      {pageError ? <Alert>{pageError}</Alert> : null}
      {error ? (
        <Alert>
          {error instanceof ApiError ? error.message : "Failed to load teachers."}
        </Alert>
      ) : null}

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
            className: "w-56",
            cell: (row) => (
              <div className="flex gap-2">
                <Link
                  href={`/admin/teachers/${row.id}`}
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
        rows={teachers}
        isLoading={isPending}
        emptyMessage="No teachers yet."
        emptyDescription="Create the first teacher account to get started."
        emptyAction={
          <Button type="button" onClick={openCreate}>
            Add teacher
          </Button>
        }
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
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editingId ? "Save changes" : "Create teacher"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
