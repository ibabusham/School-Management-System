/**
 * Admin student detail — profile, class, learning progress, and notes.
 */
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchClass, type ClassDetail } from "@/lib/api/classes";
import { ApiError } from "@/lib/api/client";
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
import { fetchStudent, type StudentDetail } from "@/lib/api/students";
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

  const params = useParams<{ id: string }>();
  const studentId = params.id;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [notes, setNotes] = useState<ProgressNote[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NoteFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

        if (studentRecord.classId) {
          const classRecord = await fetchClass(studentRecord.classId).catch(
            () => null
          );
          setClassData(classRecord);
        } else {
          setClassData(null);
        }
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
    setIsSaving(true);

    try {
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
      setError(err instanceof ApiError ? err.message : "Failed to delete note.");
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

      {error ? <Alert>{error}</Alert> : null}

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
                  label="Overall average"
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
