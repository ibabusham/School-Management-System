/**
 * Admin terms page — full CRUD for academic terms.
 *
 * Each term belongs to an academic year. Max 2 terms per year (enforced server-side).
 * Pattern matches admin/subjects page (CRUD + one dropdown).
 */
"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchAcademicYears, type AcademicYear } from "@/lib/api/academic-years";
import { ApiError } from "@/lib/api/client";
import {
  createTerm,
  deleteTerm,
  fetchTerm,
  fetchTerms,
  updateTerm,
  type CreateTermInput,
  type Term,
  type UpdateTermInput,
} from "@/lib/api/terms";
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

/** Shape of the create/edit form — dates are "YYYY-MM-DD" from <input type="date">. */
type TermFormState = {
  termName: string;
  startDate: string;
  endDate: string;
  yearId: string;
};

/** Returns blank form values; dropdown default is set when opening create. */
const emptyForm = (yearId = ""): TermFormState => ({
  termName: "",
  startDate: "",
  endDate: "",
  yearId,
});

/** Maps a full term record from the API into form state for editing. */
function termToForm(term: Term): TermFormState {
  return {
    termName: term.termName,
    startDate: toDateInputValue(term.startDate),
    endDate: toDateInputValue(term.endDate),
    yearId: term.yearId,
  };
}

export default function AdminTermsPage() {
  // Only admins can access this route — redirects others to their home page.
  useRequireAuth(["ADMIN"]);
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  // --- List state (table + pagination) ---
  const [page, setPage] = useState(1);
  const [pageError, setPageError] = useState<string | null>(null);

  // --- Modal / form state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TermFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["terms", page],
    queryFn: () => fetchTerms(page, 10),
    placeholderData: keepPreviousData,
  });

  const terms = data?.data ?? [];
  const pagination = data?.pagination ?? null;

  const { data: academicYearsData } = useQuery({
    queryKey: ["academicYears", "all"],
    queryFn: () => fetchAcademicYears(1, 100),
    staleTime: 5 * 60_000,
  });
  const academicYears: AcademicYear[] = academicYearsData?.data ?? [];

  // True when at least one academic year exists (needed to create a term).
  const canCreate = academicYears.length > 0;

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateTermInput | UpdateTermInput) => {
      if (editingId) {
        return updateTerm(editingId, payload as UpdateTermInput);
      }
      return createTerm(payload as CreateTermInput);
    },
    onSuccess: () => {
      toast.success(editingId ? "Term updated." : "Term created.");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["terms"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTerm,
    onSuccess: () => {
      toast.success("Term deleted.");
      queryClient.invalidateQueries({ queryKey: ["terms"] });
    },
  });

  function openCreate() {
    setEditingId(null);
    // Pre-select first academic year so the user doesn't start with an empty dropdown.
    setForm(emptyForm(academicYears[0]?.id ?? ""));
    setFormError(null);
    setModalOpen(true);
  }

  /** Fetches full term detail before opening the edit modal. */
  async function openEdit(id: string) {
    setFormError(null);
    setEditingId(id);

    try {
      const term = await fetchTerm(id);
      setForm(termToForm(term));
      setModalOpen(true);
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : "Failed to load term.");
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
  }

  /** Type-safe helper to update a single form field without repeating spread logic. */
  function updateField<K extends keyof TermFormState>(
    key: K,
    value: TermFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    // Client-side check: endDate must be on/after startDate (backend also enforces this).
    if (form.endDate < form.startDate) {
      setFormError("End date must be on or after the start date.");
      return;
    }

    try {
      if (editingId) {
        const payload: UpdateTermInput = {
          termName: form.termName,
          startDate: form.startDate,
          endDate: form.endDate,
          yearId: form.yearId,
        };
        await saveMutation.mutateAsync(payload);
      } else {
        const payload: CreateTermInput = {
          termName: form.termName,
          startDate: form.startDate,
          endDate: form.endDate,
          yearId: form.yearId,
        };
        await saveMutation.mutateAsync(payload);
      }
    } catch (err) {
      // Surfaces backend errors like "maximum of 2 terms" in the modal.
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save term."
      );
    }
  }

  async function handleDelete(term: Term) {
    const confirmed = await confirm({
      title: "Delete term",
      description: `Delete term "${term.termName}"? This cannot be undone.`,
    });
    if (!confirmed) {
      return;
    }

    setPageError(null);

    try {
      await deleteMutation.mutateAsync(term.id);
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : "Failed to delete term.");
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Administration"
        title="Terms"
        description="Manage academic terms and assign them to academic years."
      />

      {pageError ? <Alert>{pageError}</Alert> : null}
      {error ? (
        <Alert>
          {error instanceof ApiError ? error.message : "Failed to load terms."}
        </Alert>
      ) : null}

      <DataTableCard
        title="All terms"
        description="Browse, create, edit, and remove term records."
        action={
          <Button type="button" onClick={openCreate} disabled={!canCreate}>
            Add term
          </Button>
        }
        columns={[
          {
            key: "termName",
            header: "Name",
            cell: (row) => (
              <span className="font-medium text-white">{row.termName}</span>
            ),
          },
          {
            key: "year",
            header: "Academic year",
            cell: (row) => row.year?.yearName ?? "—",
          },
          {
            key: "startDate",
            header: "Start",
            cell: (row) => formatDate(row.startDate),
          },
          {
            key: "endDate",
            header: "End",
            cell: (row) => formatDate(row.endDate),
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
        rows={terms}
        isLoading={isPending}
        emptyMessage="No terms yet."
        emptyDescription="Create a term inside an academic year. Each year can have up to two terms."
        emptyAction={
          <Button type="button" onClick={openCreate} disabled={!canCreate}>
            Add term
          </Button>
        }
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />

      {!canCreate && !isPending ? (
        <Alert variant="info">
          You need an academic year before creating terms.
        </Alert>
      ) : null}

      <Modal
        open={modalOpen}
        title={editingId ? "Edit term" : "Add term"}
        description={
          editingId
            ? "Update term details."
            : "Create a new term and assign it to an academic year."
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Term name" htmlFor="termName">
            <Input
              id="termName"
              required
              value={form.termName}
              onChange={(event) => updateField("termName", event.target.value)}
            />
          </FormField>

          <FormField label="Academic year" htmlFor="yearId">
            <Select
              id="yearId"
              required
              value={form.yearId}
              onChange={(event) => updateField("yearId", event.target.value)}
            >
              <option value="">Select academic year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.yearName}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Start date" htmlFor="startDate">
              <Input
                id="startDate"
                type="date"
                required
                value={form.startDate}
                onChange={(event) => updateField("startDate", event.target.value)}
              />
            </FormField>

            <FormField label="End date" htmlFor="endDate">
              <Input
                id="endDate"
                type="date"
                required
                value={form.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
              />
            </FormField>
          </div>

          {formError ? <Alert>{formError}</Alert> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editingId ? "Save changes" : "Create term"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
