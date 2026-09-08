/**
 * Teacher student detail page — view a student's learning progress and manage notes.
 *
 * Shows progress stats (StatCards) + a notes table with full CRUD.
 * noteDate and teacherId are optional on create (server defaults them).
 */
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { fetchStudent, type StudentDetail } from "@/lib/api/students";
import {
  createProgressNote,
  deleteProgressNote,
  fetchLearningProgress,
  fetchProgressNotes,
  updateProgressNote,
  type CreateProgressNoteInput,
  type LearningProgress,
  type ProgressNote,
  type UpdateProgressNoteInput,
} from "@/lib/api/learning-progress";
import type { Pagination } from "@/lib/auth/types";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DataTableCard } from "@/components/admin/data-table-card";
import { FormField } from "@/components/admin/form-field";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatDate, toDateInputValue } from "@/lib/utils/dates";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

/** Shape of the create/edit form. noteDate is optional (server defaults to now). */
type NoteFormState = {
  noteDate: string;
  noteObservation: string;
  strengths: string;
  areasForImprovement: string;
};

const emptyForm = (): NoteFormState => ({
  noteDate: "",
  noteObservation: "",
  strengths: "",
  areasForImprovement: "",
});

/** Maps a progress note from the API into form state for editing. */
function noteToForm(note: ProgressNote): NoteFormState {
  return {
    noteDate: note.noteDate ? toDateInputValue(note.noteDate) : "",
    noteObservation: note.noteObservation,
    strengths: note.strengths,
    areasForImprovement: note.areasForImprovement,
  };
}

export default function TeacherStudentDetailPage() {
  // Only teachers can access this route.
  useRequireAuth(["TEACHER"]);
  const confirm = useConfirm();

  const params = useParams<{ id: string }>();
  const studentId = params.id;

  // --- Student + progress state ---
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [progress, setProgress] = useState<LearningProgress | null>(null);

  // --- Notes list state ---
  const [notes, setNotes] = useState<ProgressNote[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);

  // --- General state ---
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Modal / form state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NoteFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  /** Loads student detail, learning progress, and paginated notes in parallel. */
  const loadData = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const [studentRecord, progressRecord, notesResult] = await Promise.all([
          fetchStudent(studentId),
          fetchLearningProgress(studentId).catch(() => null),
          fetchProgressNotes(studentId, targetPage, 10),
        ]);
        setStudent(studentRecord);
        setProgress(progressRecord);
        setNotes(notesResult.data);
        setPagination(notesResult.pagination);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Failed to load student."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [studentId]
  );

  useEffect(() => {
    void loadData(page);
  }, [page, loadData]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setModalOpen(true);
  }

  /** Maps the list row directly to form state (no GET needed). */
  function openEdit(note: ProgressNote) {
    setFormError(null);
    setEditingId(note.id);
    setForm(noteToForm(note));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
  }

  /** Type-safe helper to update a single form field. */
  function updateField<K extends keyof NoteFormState>(
    key: K,
    value: NoteFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      // noteDate is optional — only include it if the user picked one.
      const noteDate = form.noteDate || undefined;

      if (editingId) {
        const payload: UpdateProgressNoteInput = {
          noteDate,
          noteObservation: form.noteObservation,
          strengths: form.strengths,
          areasForImprovement: form.areasForImprovement,
        };
        await updateProgressNote(studentId, editingId, payload);
      } else {
        const payload: CreateProgressNoteInput = {
          noteDate,
          noteObservation: form.noteObservation,
          strengths: form.strengths,
          areasForImprovement: form.areasForImprovement,
        };
        await createProgressNote(studentId, payload);
      }

      toast.success(editingId ? "Note updated." : "Note added.");
      closeModal();
      await loadData(page);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save note."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(note: ProgressNote) {
    const confirmed = await confirm({
      title: "Delete note",
      description: "Delete this progress note? This cannot be undone.",
    });
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteProgressNote(studentId, note.id);
      toast.success("Note deleted.");
      await loadData(page);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete note."
      );
    }
  }

  const studentName = student
    ? `${student.firstName} ${student.lastName}`
    : "Student details";

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Teacher Portal"
        title={studentName}
        description="View learning progress and manage progress notes."
        breadcrumbs={[
          { label: "Students", href: "/teacher/students" },
          { label: studentName },
        ]}
      />

      {error ? <Alert>{error}</Alert> : null}

      {isLoading ? (
        <Card className="p-8">
          <p className="text-sm text-sidebar-muted">Loading student details...</p>
        </Card>
      ) : student ? (
        <>
          {/* Progress stats */}
          {progress ? (
            <DashboardSection
              title="Learning progress"
              description="Academic and attendance summary."
            >
              <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Subject average"
                  value={`${progress.subjectsAverages}%`}
                  large
                />
                <StatCard
                  label="GPA"
                  value={`${progress.overallAvreages}%`}
                  large
                />
                <StatCard
                  label="Attendance"
                  value={`${progress.attendencePercentage}%`}
                  large
                />
                <StatCard label="Status" value={progress.learningStatus} />
              </dl>
            </DashboardSection>
          ) : null}

          {/* Notes table with CRUD */}
          <DataTableCard
            title="Progress notes"
            description="Teacher observations and recommendations."
            action={
              <Button type="button" onClick={openCreate}>
                Add note
              </Button>
            }
            columns={[
              {
                key: "noteDate",
                header: "Date",
                cell: (row) =>
                  row.noteDate ? formatDate(row.noteDate) : "—",
              },
              {
                key: "teacher",
                header: "Teacher",
                cell: (row) => row.teacher?.name ?? "—",
              },
              {
                key: "noteObservation",
                header: "Observation",
                cell: (row) => (
                  <span className="line-clamp-2">{row.noteObservation}</span>
                ),
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
            rows={notes}
            isLoading={false}
            emptyMessage="No progress notes yet."
            emptyDescription="Add an observation about this student’s learning."
            emptyAction={
              <Button type="button" onClick={openCreate}>
                Add note
              </Button>
            }
            pagination={pagination}
            page={page}
            onPageChange={setPage}
          />
        </>
      ) : null}

      <Modal
        open={modalOpen}
        title={editingId ? "Edit note" : "Add note"}
        description={
          editingId
            ? "Update this progress note."
            : "Record a new progress note for this student."
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Note date (optional)" htmlFor="noteDate">
            <Input
              id="noteDate"
              type="date"
              value={form.noteDate}
              onChange={(event) => updateField("noteDate", event.target.value)}
            />
          </FormField>

          <FormField label="Observation" htmlFor="noteObservation">
            <textarea
              id="noteObservation"
              required
              rows={3}
              value={form.noteObservation}
              onChange={(event) =>
                updateField("noteObservation", event.target.value)
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </FormField>

          <FormField label="Strengths" htmlFor="strengths">
            <textarea
              id="strengths"
              required
              rows={2}
              value={form.strengths}
              onChange={(event) => updateField("strengths", event.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </FormField>

          <FormField label="Areas for improvement" htmlFor="areasForImprovement">
            <textarea
              id="areasForImprovement"
              required
              rows={2}
              value={form.areasForImprovement}
              onChange={(event) =>
                updateField("areasForImprovement", event.target.value)
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </FormField>

          {formError ? <Alert>{formError}</Alert> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Save changes" : "Create note"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
