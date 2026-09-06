"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createAssignment,
  deleteAssignment,
  fetchAssignment,
  fetchAssignments,
  updateAssignment,
  type AssignmentDetail,
  type AssignmentSummary,
  type CreateAssignmentInput,
  type UpdateAssignmentInput,
} from "@/lib/api/assignments";
import { ApiError } from "@/lib/api/client";
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

type AssignmentFormState = {
  title: string;
  description: string;
  dueDate: string;
  maximumGrade: string;
  submissionInstructions: string;
  subjectId: string;
  attachments: string;
};

const emptyForm = (subjectId = ""): AssignmentFormState => ({
  title: "",
  description: "",
  dueDate: "",
  maximumGrade: "100",
  submissionInstructions: "",
  subjectId,
  attachments: "",
});

function assignmentToForm(assignment: AssignmentDetail): AssignmentFormState {
  return {
    title: assignment.assignmentTitle,
    description: assignment.assignmentDescription,
    dueDate: toDateInputValue(assignment.dueDate),
    maximumGrade: String(assignment.maximumGrade),
    submissionInstructions: assignment.submissionInstructions,
    subjectId: assignment.subjectId,
    attachments: assignment.attachment,
  };
}

function tomorrowDateInputValue() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDateInputValue(date.toISOString());
}

export default function TeacherAssignmentsPage() {
  useRequireAuth(["TEACHER"]);

  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialDueDate, setInitialDueDate] = useState("");
  const [form, setForm] = useState<AssignmentFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const subjectNameById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject.subjectName])),
    [subjects]
  );

  const loadSubjects = useCallback(async () => {
    try {
      const result = await fetchSubjects(1, 100);
      setSubjects(result.data);
    } catch {
      setSubjects([]);
    }
  }, []);

  const loadAssignments = useCallback(
    async (targetPage: number, filterSubjectId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchAssignments(
          targetPage,
          10,
          filterSubjectId || undefined
        );
        setAssignments(result.data);
        setPagination(result.pagination);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Failed to load assignments."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    void loadAssignments(page, subjectFilter);
  }, [page, subjectFilter, loadAssignments]);

  function openCreate() {
    setEditingId(null);
    setInitialDueDate("");
    setForm({
      ...emptyForm(subjects[0]?.id ?? ""),
      dueDate: tomorrowDateInputValue(),
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function openEdit(id: string) {
    setFormError(null);
    setEditingId(id);

    try {
      const assignment = await fetchAssignment(id);
      const nextForm = assignmentToForm(assignment);
      setForm(nextForm);
      setInitialDueDate(nextForm.dueDate);
      setModalOpen(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load assignment."
      );
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setInitialDueDate("");
    setForm(emptyForm());
    setFormError(null);
  }

  function updateField<K extends keyof AssignmentFormState>(
    key: K,
    value: AssignmentFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      if (editingId) {
        const payload: UpdateAssignmentInput = {
          title: form.title,
          description: form.description,
          maximumGrade: Number(form.maximumGrade),
          submissionInstructions: form.submissionInstructions,
          subjectId: form.subjectId,
          attachments: form.attachments,
        };

        if (form.dueDate !== initialDueDate) {
          payload.dueDate = form.dueDate;
        }

        await updateAssignment(editingId, payload);
      } else {
        const payload: CreateAssignmentInput = {
          title: form.title,
          description: form.description,
          dueDate: form.dueDate,
          maximumGrade: Number(form.maximumGrade),
          submissionInstructions: form.submissionInstructions,
          subjectId: form.subjectId,
          attachments: form.attachments,
        };
        await createAssignment(payload);
      }

      closeModal();
      await loadAssignments(page, subjectFilter);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save assignment."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(assignment: AssignmentSummary) {
    const confirmed = window.confirm(
      `Delete assignment "${assignment.assignmentTitle}"?`
    );
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteAssignment(assignment.id);
      await loadAssignments(page, subjectFilter);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete assignment."
      );
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Teacher Portal"
        title="Assignments"
        description="Create and grade assignments for your subjects."
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
        title="All assignments"
        description="Assignments across your assigned subjects."
        action={
          <Button
            type="button"
            onClick={openCreate}
            disabled={subjects.length === 0}
          >
            Add assignment
          </Button>
        }
        columns={[
          {
            key: "title",
            header: "Title",
            cell: (row) => (
              <span className="font-medium text-white">
                {row.assignmentTitle}
              </span>
            ),
          },
          {
            key: "dueDate",
            header: "Due date",
            cell: (row) => formatDate(row.dueDate),
          },
          {
            key: "subject",
            header: "Subject",
            cell: (row) => subjectNameById.get(row.subjectId) ?? "—",
          },
          {
            key: "maximumGrade",
            header: "Max grade",
            cell: (row) => row.maximumGrade,
          },
          {
            key: "actions",
            header: "Actions",
            className: "w-52",
            cell: (row) => (
              <div className="flex gap-2">
                <Link
                  href={`/teacher/assignments/${row.id}`}
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover"
                >
                  Grade
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
        rows={assignments}
        isLoading={isLoading}
        emptyMessage="No assignments found."
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />

      {subjects.length === 0 && !isLoading ? (
        <Alert variant="info">
          You need at least one assigned subject before creating assignments.
        </Alert>
      ) : null}

      <Modal
        open={modalOpen}
        title={editingId ? "Edit assignment" : "Add assignment"}
        description={
          editingId
            ? "Update assignment details."
            : "Create a new assignment for a subject."
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" htmlFor="title">
            <Input
              id="title"
              required
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
            />
          </FormField>

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
            <FormField label="Due date" htmlFor="dueDate">
              <Input
                id="dueDate"
                type="date"
                required
                value={form.dueDate}
                onChange={(event) => updateField("dueDate", event.target.value)}
              />
            </FormField>

            <FormField label="Maximum grade" htmlFor="maximumGrade">
              <Input
                id="maximumGrade"
                type="number"
                min={1}
                required
                value={form.maximumGrade}
                onChange={(event) =>
                  updateField("maximumGrade", event.target.value)
                }
              />
            </FormField>
          </div>

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

          <FormField label="Submission instructions" htmlFor="submissionInstructions">
            <textarea
              id="submissionInstructions"
              required
              rows={3}
              value={form.submissionInstructions}
              onChange={(event) =>
                updateField("submissionInstructions", event.target.value)
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </FormField>

          <FormField label="Attachment URL" htmlFor="attachments">
            <Input
              id="attachments"
              type="url"
              required
              placeholder="https://example.com/assignment.pdf"
              value={form.attachments}
              onChange={(event) => updateField("attachments", event.target.value)}
            />
          </FormField>

          {!editingId ? (
            <p className="text-xs text-muted-foreground">
              Due date must be in the future when creating a new assignment.
            </p>
          ) : null}

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
                  : "Create assignment"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
