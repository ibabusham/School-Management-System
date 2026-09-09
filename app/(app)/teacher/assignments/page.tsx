"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialDueDate, setInitialDueDate] = useState("");
  const [form, setForm] = useState<AssignmentFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["assignments", page, subjectFilter],
    queryFn: () => fetchAssignments(page, 10, subjectFilter || undefined),
    placeholderData: keepPreviousData,
  });

  const assignments = data?.data ?? [];
  const pagination = data?.pagination ?? null;

  const { data: subjectsData } = useQuery({
    queryKey: ["subjects", "all"],
    queryFn: () => fetchSubjects(1, 100),
    staleTime: 5 * 60_000,
  });
  const subjects = subjectsData?.data ?? [];

  const subjectNameById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject.subjectName])),
    [subjects]
  );

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateAssignmentInput | UpdateAssignmentInput) => {
      if (editingId) {
        return updateAssignment(editingId, payload as UpdateAssignmentInput);
      }
      return createAssignment(payload as CreateAssignmentInput);
    },
    onSuccess: () => {
      toast.success(editingId ? "Assignment updated." : "Assignment created.");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => {
      toast.success("Assignment deleted.");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });

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
      setPageError(
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

        await saveMutation.mutateAsync(payload);
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
        await saveMutation.mutateAsync(payload);
      }
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save assignment."
      );
    }
  }

  async function handleDelete(assignment: AssignmentSummary) {
    const confirmed = await confirm({
      title: "Delete assignment",
      description: `Delete assignment "${assignment.assignmentTitle}"? This cannot be undone.`,
    });
    if (!confirmed) {
      return;
    }

    setPageError(null);

    try {
      await deleteMutation.mutateAsync(assignment.id);
    } catch (err) {
      setPageError(
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

      {pageError ? <Alert>{pageError}</Alert> : null}
      {error ? (
        <Alert>
          {error instanceof ApiError ? error.message : "Failed to load assignments."}
        </Alert>
      ) : null}

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
        rows={assignments}
        isLoading={isPending}
        emptyMessage="No assignments yet."
        emptyDescription="Create an assignment for one of your subjects."
        emptyAction={
          <Button type="button" onClick={openCreate} disabled={subjects.length === 0}>
            Add assignment
          </Button>
        }
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />

      {subjects.length === 0 && !isPending ? (
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
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
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
