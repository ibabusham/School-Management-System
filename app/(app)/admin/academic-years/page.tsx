/**
 * Admin academic years page — full CRUD for academic years.
 *
 * Only one academic year can be ACTIVE at a time (enforced server-side).
 * Pattern matches admin/terms page (CRUD + date fields).
 */
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createAcademicYear,
  deleteAcademicYear,
  fetchAcademicYear,
  fetchAcademicYears,
  updateAcademicYear,
  type AcademicYear,
  type CreateAcademicYearInput,
  type UpdateAcademicYearInput,
} from "@/lib/api/academic-years";
import { ApiError } from "@/lib/api/client";
import type { Pagination } from "@/lib/auth/types";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DataTableCard } from "@/components/admin/data-table-card";
import { FormField } from "@/components/admin/form-field";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatDate, toDateInputValue } from "@/lib/utils/dates";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

type AcademicYearFormState = {
  yearName: string;
  startDate: string;
  endDate: string;
};

const emptyForm = (): AcademicYearFormState => ({
  yearName: "",
  startDate: "",
  endDate: "",
});

function yearToForm(year: AcademicYear): AcademicYearFormState {
  return {
    yearName: year.yearName,
    startDate: toDateInputValue(year.startDate),
    endDate: toDateInputValue(year.endDate),
  };
}

export default function AdminAcademicYearsPage() {
  useRequireAuth(["ADMIN"]);
  const confirm = useConfirm();

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AcademicYearFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadYears = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchAcademicYears(targetPage, 10);
      setYears(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load academic years."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadYears(page);
  }, [page, loadYears]);

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
      const year = await fetchAcademicYear(id);
      setForm(yearToForm(year));
      setModalOpen(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load academic year."
      );
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
  }

  function updateField<K extends keyof AcademicYearFormState>(
    key: K,
    value: AcademicYearFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (form.endDate < form.startDate) {
      setFormError("End date must be on or after the start date.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        const payload: UpdateAcademicYearInput = {
          yearName: form.yearName,
          startDate: form.startDate,
          endDate: form.endDate,
        };
        await updateAcademicYear(editingId, payload);
      } else {
        const payload: CreateAcademicYearInput = {
          yearName: form.yearName,
          startDate: form.startDate,
          endDate: form.endDate,
        };
        await createAcademicYear(payload);
      }

      toast.success(editingId ? "Academic year updated." : "Academic year created.");
      closeModal();
      await loadYears(page);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save academic year."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(year: AcademicYear) {
    const confirmed = await confirm({
      title: "Delete academic year",
      description: `Delete academic year "${year.yearName}"? This cannot be undone.`,
    });
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteAcademicYear(year.id);
      toast.success("Academic year deleted.");
      await loadYears(page);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete academic year."
      );
    }
  }

  async function handleToggleStatus(year: AcademicYear) {
    const newStatus = year.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const confirmed = await confirm({
      title: newStatus === "ACTIVE" ? "Activate year" : "Deactivate year",
      description:
        newStatus === "ACTIVE"
          ? `Activate "${year.yearName}"? If another year is already active, this will be blocked.`
          : `Deactivate "${year.yearName}"? You can reactivate it later.`,
      confirmLabel: newStatus === "ACTIVE" ? "Activate" : "Deactivate",
    });
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await updateAcademicYear(year.id, { status: newStatus });
      toast.success(
        newStatus === "ACTIVE"
          ? "Academic year activated."
          : "Academic year deactivated."
      );
      await loadYears(page);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to update status."
      );
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Administration"
        title="Academic Years"
        description="Create and manage academic years. Only one year can be active at a time."
      />

      {error ? <Alert>{error}</Alert> : null}

      <DataTableCard
        title="All academic years"
        description="Browse, create, edit, and remove academic year records."
        action={
          <Button type="button" onClick={openCreate}>
            Add academic year
          </Button>
        }
        columns={[
          {
            key: "yearName",
            header: "Year",
            cell: (row) => (
              <span className="font-medium text-white">{row.yearName}</span>
            ),
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
            key: "status",
            header: "Status",
            cell: (row) => row.status,
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
                  onClick={() => void handleToggleStatus(row)}
                >
                  {row.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </Button>
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
        rows={years}
        isLoading={isLoading}
        emptyMessage="No academic years yet."
        emptyDescription="Create the first academic year to start organizing classes and terms."
        emptyAction={
          <Button type="button" onClick={openCreate}>
            Add academic year
          </Button>
        }
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />

      <Modal
        open={modalOpen}
        title={editingId ? "Edit academic year" : "Add academic year"}
        description={
          editingId
            ? "Update academic year details."
            : "Create a new academic year. It will be marked active if no other year is active."
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Year name" htmlFor="yearName">
            <Input
              id="yearName"
              required
              value={form.yearName}
              onChange={(event) => updateField("yearName", event.target.value)}
              placeholder="e.g. 2025-2026"
            />
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
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : editingId
                ? "Save changes"
                : "Create academic year"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
