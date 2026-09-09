/**
 * Admin student detail — profile, class, learning progress, and notes.
 */
"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { fetchClass } from "@/lib/api/classes";
import { ApiError } from "@/lib/api/client";
import {
  createProgressNote,
  deleteProgressNote,
  fetchLearningProgress,
  fetchProgressNotes,
  updateProgressNote,
  type CreateProgressNoteInput,
  type ProgressNote,
  type UpdateProgressNoteInput,
} from "@/lib/api/learning-progress";
import { fetchStudent } from "@/lib/api/students";
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

function noteToForm(note: ProgressNote): NoteFormState {
  return {
    noteDate: note.noteDate ? toDateInputValue(note.noteDate) : "",
    noteObservation: note.noteObservation,
    strengths: note.strengths,
    areasForImprovement: note.areasForImprovement,
  };
}

export default function AdminStudentDetailPage() {
  useRequireAuth(["ADMIN"]);
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const params = useParams<{ id: string }>();
  const studentId = params.id;

  const [page, setPage] = useState(1);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NoteFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: student, isPending: isLoading, error: studentError } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => fetchStudent(studentId),
  });

  const { data: progress } = useQuery({
    queryKey: ["learningProgress", studentId],
    queryFn: () => fetchLearningProgress(studentId),
    retry: false,
  });

  const { data: notesData, isPending: notesLoading } = useQuery({
    queryKey: ["progressNotes", studentId, page],
    queryFn: () => fetchProgressNotes(studentId, page, 10),
    placeholderData: keepPreviousData,
  });

  const notes = notesData?.data ?? [];
  const pagination = notesData?.pagination ?? null;

  const { data: classData } = useQuery({
    queryKey: ["class", student?.classId],
    queryFn: () => fetchClass(student!.classId!),
    enabled: !!student?.classId,
  });

  const error = studentError;

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateProgressNoteInput | UpdateProgressNoteInput) => {
      if (editingId) {
        return updateProgressNote(studentId, editingId, payload as UpdateProgressNoteInput);
      }
      return createProgressNote(studentId, payload as CreateProgressNoteInput);
    },
    onSuccess: () => {
      toast.success(editingId ? "Note updated." : "Note added.");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["progressNotes", studentId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => deleteProgressNote(studentId, noteId),
    onSuccess: () => {
      toast.success("Note deleted.");
      queryClient.invalidateQueries({ queryKey: ["progressNotes", studentId] });
    },
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setModalOpen(true);
  }

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

  function updateField<K extends keyof NoteFormState>(
    key: K,
    value: NoteFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    try {
      const noteDate = form.noteDate || undefined;

      if (editingId) {
        const payload: UpdateProgressNoteInput = {
          noteDate,
          noteObservation: form.noteObservation,
          strengths: form.strengths,
          areasForImprovement: form.areasForImprovement,
        };
        await saveMutation.mutateAsync(payload);
      } else {
        const payload: CreateProgressNoteInput = {
          noteDate,
          noteObservation: form.noteObservation,
          strengths: form.strengths,
          areasForImprovement: form.areasForImprovement,
        };
        await saveMutation.mutateAsync(payload);
      }
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save note."
      );
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

    setPageError(null);

    try {
      await deleteMutation.mutateAsync(note.id);
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : "Failed to delete note.");
    }
  }

  const studentName = student
    ? `${student.firstName} ${student.lastName}`
    : "Student details";

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Administration"
        title={studentName}
        description="View profile, class, learning progress, and notes."
        breadcrumbs={[
          { label: "Students", href: "/admin/students" },
          { label: studentName },
        ]}
      />

      {pageError ? <Alert>{pageError}</Alert> : null}
      {error ? (
        <Alert>
          {error instanceof ApiError ? error.message : "Failed to load student."}
        </Alert>
      ) : null}

      {isLoading ? (
        <Card className="p-8">
          <p className="text-sm text-sidebar-muted">Loading student details...</p>
        </Card>
      ) : student ? (
        <>
          <DashboardSection
            title="Student profile"
            description="Account and enrollment details."
          >
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Student ID</h3>
                <p className="text-sm text-sidebar-muted">{student.studentId}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Email</h3>
                <p className="text-sm text-sidebar-muted">{student.email}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Phone</h3>
                <p className="text-sm text-sidebar-muted">
                  {student.phoneNumber || "—"}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Class</h3>
                <p className="text-sm text-sidebar-muted">
                  {classData?.className ?? "Unassigned"}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Date of birth</h3>
                <p className="text-sm text-sidebar-muted">
                  {formatDate(student.dateOfBirth)}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Enrolled</h3>
                <p className="text-sm text-sidebar-muted">
                  {formatDate(student.enrollmentDate)}
                </p>
              </div>
            </div>
          </DashboardSection>

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
                cell: (row) => (row.noteDate ? formatDate(row.noteDate) : "—"),
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
            isLoading={notesLoading}
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
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editingId ? "Save changes" : "Create note"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
