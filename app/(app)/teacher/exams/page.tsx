"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  createExam,
  deleteExam,
  fetchExam,
  fetchExams,
  updateExam,
  type CreateExamInput,
  type ExamDetail,
  type ExamSummary,
  type UpdateExamInput,
} from "@/lib/api/exams";
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

type ExamFormState = {
  examName: string;
  examDate: string;
  subjectId: string;
  maximumGrade: string;
};

const emptyForm = (subjectId = ""): ExamFormState => ({
  examName: "",
  examDate: "",
  subjectId,
  maximumGrade: "100",
});

function examToForm(exam: ExamDetail): ExamFormState {
  return {
    examName: exam.examName,
    examDate: toDateInputValue(exam.examDate),
    subjectId: exam.subjectId,
    maximumGrade: String(exam.maximumGrade),
  };
}

export default function TeacherExamsPage() {
  useRequireAuth(["TEACHER"]);
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExamFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["exams", page, subjectFilter],
    queryFn: () => fetchExams(page, 10, subjectFilter || undefined),
    placeholderData: keepPreviousData,
  });

  const exams = data?.data ?? [];
  const pagination = data?.pagination ?? null;

  const { data: subjectsData } = useQuery({
    queryKey: ["subjects", "all"],
    queryFn: () => fetchSubjects(1, 100),
    staleTime: 5 * 60_000,
  });
  const subjects = subjectsData?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateExamInput | UpdateExamInput) => {
      if (editingId) {
        return updateExam(editingId, payload as UpdateExamInput);
      }
      return createExam(payload as CreateExamInput);
    },
    onSuccess: () => {
      toast.success(editingId ? "Exam updated." : "Exam created.");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExam,
    onSuccess: () => {
      toast.success("Exam deleted.");
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(subjects[0]?.id ?? ""));
    setFormError(null);
    setModalOpen(true);
  }

  async function openEdit(id: string) {
    setFormError(null);
    setEditingId(id);

    try {
      const exam = await fetchExam(id);
      setForm(examToForm(exam));
      setModalOpen(true);
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : "Failed to load exam.");
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
  }

  function updateField<K extends keyof ExamFormState>(
    key: K,
    value: ExamFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    try {
      if (editingId) {
        const payload: UpdateExamInput = {
          examName: form.examName,
          examDate: form.examDate,
          subjectId: form.subjectId,
          maximumGrade: Number(form.maximumGrade),
        };
        await saveMutation.mutateAsync(payload);
      } else {
        const payload: CreateExamInput = {
          examName: form.examName,
          examDate: form.examDate,
          subjectId: form.subjectId,
          maximumGrade: Number(form.maximumGrade),
        };
        await saveMutation.mutateAsync(payload);
      }
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save exam.");
    }
  }

  async function handleDelete(exam: ExamSummary) {
    const confirmed = await confirm({
      title: "Delete exam",
      description: `Delete exam "${exam.examName}"? This cannot be undone.`,
    });
    if (!confirmed) {
      return;
    }

    setPageError(null);

    try {
      await deleteMutation.mutateAsync(exam.id);
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : "Failed to delete exam.");
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Teacher Portal"
        title="Exams"
        description="Create and manage exams for your subjects."
      />

      {pageError ? <Alert>{pageError}</Alert> : null}
      {error ? (
        <Alert>
          {error instanceof ApiError ? error.message : "Failed to load exams."}
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
        title="All exams"
        description="Exams across your assigned subjects."
        action={
          <Button type="button" onClick={openCreate} disabled={subjects.length === 0}>
            Add exam
          </Button>
        }
        columns={[
          {
            key: "examName",
            header: "Exam name",
            cell: (row) => (
              <span className="font-medium text-white">{row.examName}</span>
            ),
          },
          {
            key: "examDate",
            header: "Date",
            cell: (row) => formatDate(row.examDate),
          },
          {
            key: "actions",
            header: "Actions",
            className: "w-52",
            cell: (row) => (
              <div className="flex gap-2">
                <Link
                  href={`/teacher/exams/${row.id}`}
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
        rows={exams}
        isLoading={isPending}
        emptyMessage="No exams yet."
        emptyDescription="Create an exam for one of your subjects."
        emptyAction={
          <Button type="button" onClick={openCreate} disabled={subjects.length === 0}>
            Add exam
          </Button>
        }
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />

      {subjects.length === 0 && !isPending ? (
        <Alert variant="info">
          You need at least one assigned subject before creating exams.
        </Alert>
      ) : null}

      <Modal
        open={modalOpen}
        title={editingId ? "Edit exam" : "Add exam"}
        description={
          editingId ? "Update exam details." : "Schedule a new exam for a subject."
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Exam name" htmlFor="examName">
            <Input
              id="examName"
              required
              value={form.examName}
              onChange={(event) => updateField("examName", event.target.value)}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Exam date" htmlFor="examDate">
              <Input
                id="examDate"
                type="date"
                required
                value={form.examDate}
                onChange={(event) => updateField("examDate", event.target.value)}
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

          {formError ? <Alert>{formError}</Alert> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editingId ? "Save changes" : "Create exam"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
