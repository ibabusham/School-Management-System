/**
 * Admin subjects page — full CRUD for school subjects.
 *
 * Each subject is linked to one class and one teacher.
 * Pattern matches admin/teachers and teacher/exams pages.
 */
"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { fetchClasses, type ClassSummary } from "@/lib/api/classes";
import { ApiError } from "@/lib/api/client";
import {
  createSubject,
  deleteSubject,
  fetchSubject,
  fetchSubjects,
  updateSubject,
  type CreateSubjectInput,
  type SubjectDetail,
  type SubjectSummary,
  type UpdateSubjectInput,
} from "@/lib/api/subjects";
import { fetchTeachers, type TeacherSummary } from "@/lib/api/teachers";
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
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

/** Shape of the create/edit form — mirrors CreateSubjectInput fields. */
type SubjectFormState = {
  subjectName: string;
  subjectCode: string;
  description: string;
  classId: string;
  teacherId: string;
};

/** Returns blank form values; dropdown defaults are set when opening create. */
const emptyForm = (): SubjectFormState => ({
  subjectName: "",
  subjectCode: "",
  description: "",
  classId: "",
  teacherId: "",
});

/** Maps a full subject record from the API into form state for editing. */
function subjectToForm(subject: SubjectDetail): SubjectFormState {
  return {
    subjectName: subject.subjectName,
    subjectCode: subject.subjectCode,
    description: subject.description,
    classId: subject.classId,
    teacherId: subject.teacherId,
  };
}

export default function AdminSubjectsPage() {
  // Only admins can access this route — redirects others to their home page.
  useRequireAuth(["ADMIN"]);
  const confirm = useConfirm();

  // --- List state (table + pagination) ---
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Dropdown data for the create/edit modal ---
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);

  // --- Modal / form state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubjectFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // True when both dropdowns have at least one option (needed to create a subject).
  const canCreate = classes.length > 0 && teachers.length > 0;

  /** Fetches paginated subjects for the table. */
  const loadSubjects = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchSubjects(targetPage, 10);
      setSubjects(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load subjects.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Loads all classes for the class dropdown (high limit = no pagination in modal). */
  const loadClasses = useCallback(async () => {
    try {
      const result = await fetchClasses(1, 100);
      setClasses(result.data);
    } catch {
      setClasses([]);
    }
  }, []);

  /** Loads all teachers for the teacher dropdown. */
  const loadTeachers = useCallback(async () => {
    try {
      const result = await fetchTeachers(1, 100);
      setTeachers(result.data);
    } catch {
      setTeachers([]);
    }
  }, []);

  // Load dropdown options once on mount.
  useEffect(() => {
    void loadClasses();
    void loadTeachers();
  }, [loadClasses, loadTeachers]);

  // Reload table whenever the current page changes.
  useEffect(() => {
    void loadSubjects(page);
  }, [page, loadSubjects]);

  function openCreate() {
    setEditingId(null);
    // Pre-select first class/teacher so the user doesn't start with empty dropdowns.
    setForm({
      ...emptyForm(),
      classId: classes[0]?.id ?? "",
      teacherId: teachers[0]?.id ?? "",
    });
    setFormError(null);
    setModalOpen(true);
  }

  /** Fetches full subject detail before opening the edit modal. */
  async function openEdit(id: string) {
    setFormError(null);
    setEditingId(id);

    try {
      const subject = await fetchSubject(id);
      setForm(subjectToForm(subject));
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load subject.");
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
  }

  /** Type-safe helper to update a single form field without repeating spread logic. */
  function updateField<K extends keyof SubjectFormState>(
    key: K,
    value: SubjectFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      if (editingId) {
        const payload: UpdateSubjectInput = {
          subjectName: form.subjectName,
          subjectCode: form.subjectCode,
          description: form.description,
          classId: form.classId,
          teacherId: form.teacherId,
        };
        await updateSubject(editingId, payload);
      } else {
        const payload: CreateSubjectInput = {
          subjectName: form.subjectName,
          subjectCode: form.subjectCode,
          description: form.description,
          classId: form.classId,
          teacherId: form.teacherId,
        };
        await createSubject(payload);
      }

      toast.success(editingId ? "Subject updated." : "Subject created.");
      closeModal();
      await loadSubjects(page);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save subject."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(subject: SubjectSummary) {
    const confirmed = await confirm({
      title: "Delete subject",
      description: `Delete subject "${subject.subjectName}" (${subject.subjectCode})? This cannot be undone.`,
    });
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteSubject(subject.id);
      toast.success("Subject deleted.");
      await loadSubjects(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete subject.");
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Administration"
        title="Subjects"
        description="Manage subjects, assign them to classes, and link teachers."
      />

      {error ? <Alert>{error}</Alert> : null}

      <DataTableCard
        title="All subjects"
        description="Browse, create, edit, and remove subject records."
        action={
          <Button type="button" onClick={openCreate} disabled={!canCreate}>
            Add subject
          </Button>
        }
        columns={[
          {
            key: "subjectName",
            header: "Name",
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
            key: "actions",
            header: "Actions",
            className: "w-56",
            cell: (row) => (
              <div className="flex gap-2">
                <Link
                  href={`/admin/subjects/${row.id}`}
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
        rows={subjects}
        isLoading={isLoading}
        emptyMessage="No subjects yet."
        emptyDescription="Create a subject and assign it to a class and teacher."
        emptyAction={
          <Button type="button" onClick={openCreate} disabled={!canCreate}>
            Add subject
          </Button>
        }
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />

      {!canCreate && !isLoading ? (
        <Alert variant="info">
          You need at least one class and one teacher before creating subjects.
        </Alert>
      ) : null}

      <Modal
        open={modalOpen}
        title={editingId ? "Edit subject" : "Add subject"}
        description={
          editingId
            ? "Update subject details and assignments."
            : "Create a new subject and assign it to a class and teacher."
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Subject name" htmlFor="subjectName">
              <Input
                id="subjectName"
                required
                value={form.subjectName}
                onChange={(event) => updateField("subjectName", event.target.value)}
              />
            </FormField>

            <FormField label="Subject code" htmlFor="subjectCode">
              <Input
                id="subjectCode"
                required
                value={form.subjectCode}
                onChange={(event) => updateField("subjectCode", event.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Description" htmlFor="description">
            <textarea
              id="description"
              required
              rows={3}
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Class" htmlFor="classId">
              <Select
                id="classId"
                required
                value={form.classId}
                onChange={(event) => updateField("classId", event.target.value)}
              >
                <option value="">Select class</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.className}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Teacher" htmlFor="teacherId">
              <Select
                id="teacherId"
                required
                value={form.teacherId}
                onChange={(event) => updateField("teacherId", event.target.value)}
              >
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {formError ? <Alert>{formError}</Alert> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Save changes" : "Create subject"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
