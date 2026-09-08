/**
 * Teacher lessons page — full CRUD for lessons.
 *
 * Each lesson belongs to a subject the teacher owns. Lesson date must be in the future.
 * Pattern matches teacher/exams page (CRUD + subject filter + dropdown).
 */
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  createLesson,
  deleteLesson,
  fetchLesson,
  fetchLessons,
  updateLesson,
  type CreateLessonInput,
  type LessonDetail,
  type LessonSummary,
  type UpdateLessonInput,
} from "@/lib/api/lessons";
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
type LessonFormState = {
  lessonTitle: string;
  lessonDescription: string;
  subjectId: string;
  lessonDate: string;
  learningObjectinve: string;
  learningMaterial: string;
  completionStatus: "COMPLEATED" | "INCOMPLEATE";
};

/** Returns blank form values; dropdown default is set when opening create. */
const emptyForm = (subjectId = ""): LessonFormState => ({
  lessonTitle: "",
  lessonDescription: "",
  subjectId,
  lessonDate: "",
  learningObjectinve: "",
  learningMaterial: "",
  completionStatus: "INCOMPLEATE",
});

/** Maps a full lesson record from the API into form state for editing. */
function lessonToForm(lesson: LessonDetail): LessonFormState {
  return {
    lessonTitle: lesson.lessonTitle,
    lessonDescription: lesson.lessonDescription,
    subjectId: lesson.subjectId,
    lessonDate: toDateInputValue(lesson.lessonDate),
    learningObjectinve: lesson.learningObjectinve,
    learningMaterial: lesson.learningMaterial,
    completionStatus: lesson.completionStatus,
  };
}

export default function TeacherLessonsPage() {
  // Only teachers can access this route.
  useRequireAuth(["TEACHER"]);
  const confirm = useConfirm();

  // --- List state (table + pagination) ---
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Modal / form state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LessonFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  /** Loads all subjects for the dropdown + filter (teacher's subjects only). */
  const loadSubjects = useCallback(async () => {
    try {
      const result = await fetchSubjects(1, 100);
      setSubjects(result.data);
    } catch {
      setSubjects([]);
    }
  }, []);

  /** Fetches paginated lessons, optionally filtered by subject. */
  const loadLessons = useCallback(
    async (targetPage: number, filterSubjectId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchLessons(
          targetPage,
          10,
          filterSubjectId || undefined
        );
        setLessons(result.data);
        setPagination(result.pagination);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load lessons.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Load subjects once on mount.
  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  // Reload table whenever page or subject filter changes.
  useEffect(() => {
    void loadLessons(page, subjectFilter);
  }, [page, subjectFilter, loadLessons]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(subjects[0]?.id ?? ""));
    setFormError(null);
    setModalOpen(true);
  }

  /** Fetches full lesson detail before opening the edit modal. */
  async function openEdit(id: string) {
    setFormError(null);
    setEditingId(id);

    try {
      const lesson = await fetchLesson(id);
      setForm(lessonToForm(lesson));
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load lesson.");
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
  }

  /** Type-safe helper to update a single form field. */
  function updateField<K extends keyof LessonFormState>(
    key: K,
    value: LessonFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    // Client-side check: lesson date must be in the future (backend also enforces this).
    const selectedDate = new Date(form.lessonDate);
    const now = new Date();
    if (selectedDate.getTime() <= now.getTime()) {
      setFormError("Lesson date must be in the future.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        const payload: UpdateLessonInput = {
          lessonTitle: form.lessonTitle,
          lessonDescription: form.lessonDescription,
          subjectId: form.subjectId,
          lessonDate: form.lessonDate,
          learningObjectinve: form.learningObjectinve,
          learningMaterial: form.learningMaterial,
          completionStatus: form.completionStatus,
        };
        await updateLesson(editingId, payload);
      } else {
        const payload: CreateLessonInput = {
          lessonTitle: form.lessonTitle,
          lessonDescription: form.lessonDescription,
          subjectId: form.subjectId,
          lessonDate: form.lessonDate,
          learningObjectinve: form.learningObjectinve,
          learningMaterial: form.learningMaterial,
          completionStatus: form.completionStatus,
        };
        await createLesson(payload);
      }

      toast.success(editingId ? "Lesson updated." : "Lesson created.");
      closeModal();
      await loadLessons(page, subjectFilter);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save lesson."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(lesson: LessonSummary) {
    const confirmed = await confirm({
      title: "Delete lesson",
      description: `Delete lesson "${lesson.lessonTitle}"? This cannot be undone.`,
    });
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteLesson(lesson.id);
      toast.success("Lesson deleted.");
      await loadLessons(page, subjectFilter);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete lesson.");
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Teacher Portal"
        title="Lessons"
        description="Create and manage lessons for your subjects."
      />

      {error ? <Alert>{error}</Alert> : null}

      <div className="max-w-xs">
        <FormField label="Filter by subject" htmlFor="subjectFilter">
          <Select
            id="subjectFilter"
            value={subjectFilter}
            onChange={(event) => {
              setPage(1);
              setSubjectFilter(event.target.value);
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
      </div>

      <DataTableCard
        title="All lessons"
        description="Lessons across your assigned subjects."
        action={
          <Button
            type="button"
            onClick={openCreate}
            disabled={subjects.length === 0}
          >
            Add lesson
          </Button>
        }
        columns={[
          {
            key: "lessonTitle",
            header: "Title",
            cell: (row) => (
              <span className="font-medium text-white">{row.lessonTitle}</span>
            ),
          },
          {
            key: "lessonDate",
            header: "Date",
            cell: (row) => formatDate(row.lessonDate),
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
        rows={lessons}
        isLoading={isLoading}
        emptyMessage="No lessons yet."
        emptyDescription="Plan a lesson for one of your subjects."
        emptyAction={
          <Button type="button" onClick={openCreate} disabled={subjects.length === 0}>
            Add lesson
          </Button>
        }
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />

      {subjects.length === 0 && !isLoading ? (
        <Alert variant="info">
          You need at least one assigned subject before creating lessons.
        </Alert>
      ) : null}

      <Modal
        open={modalOpen}
        title={editingId ? "Edit lesson" : "Add lesson"}
        description={
          editingId
            ? "Update lesson details."
            : "Create a new lesson for a subject."
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Lesson title" htmlFor="lessonTitle">
            <Input
              id="lessonTitle"
              required
              value={form.lessonTitle}
              onChange={(event) => updateField("lessonTitle", event.target.value)}
            />
          </FormField>

          <FormField label="Lesson description" htmlFor="lessonDescription">
            <textarea
              id="lessonDescription"
              required
              rows={3}
              value={form.lessonDescription}
              onChange={(event) =>
                updateField("lessonDescription", event.target.value)
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
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
                    {subject.subjectName} ({subject.subjectCode})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Lesson date" htmlFor="lessonDate">
              <Input
                id="lessonDate"
                type="date"
                required
                value={form.lessonDate}
                onChange={(event) => updateField("lessonDate", event.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Learning objective" htmlFor="learningObjectinve">
            <Input
              id="learningObjectinve"
              required
              value={form.learningObjectinve}
              onChange={(event) =>
                updateField("learningObjectinve", event.target.value)
              }
            />
          </FormField>

          <FormField label="Learning material" htmlFor="learningMaterial">
            <Input
              id="learningMaterial"
              required
              value={form.learningMaterial}
              onChange={(event) =>
                updateField("learningMaterial", event.target.value)
              }
            />
          </FormField>

          <FormField label="Completion status" htmlFor="completionStatus">
            <Select
              id="completionStatus"
              required
              value={form.completionStatus}
              onChange={(event) =>
                updateField(
                  "completionStatus",
                  event.target.value as "COMPLEATED" | "INCOMPLEATE"
                )
              }
            >
              <option value="INCOMPLEATE">Incomplete</option>
              <option value="COMPLEATED">Completed</option>
            </Select>
          </FormField>

          {formError ? <Alert>{formError}</Alert> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Save changes" : "Create lesson"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
