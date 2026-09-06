"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { fetchAcademicYears, type AcademicYear } from "@/lib/api/academic-years";
import { ApiError } from "@/lib/api/client";
import {
  createClass,
  deleteClass,
  fetchClass,
  fetchClasses,
  updateClass,
  type ClassSummary,
  type CreateClassInput,
  type UpdateClassInput,
} from "@/lib/api/classes";
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
import { toDateInputValue } from "@/lib/utils/dates";

type ClassFormState = {
  className: string;
  academicYearMode: "existing" | "new";
  academicYearId: string;
  yearName: string;
  startDate: string;
  endDate: string;
};

const emptyForm = (): ClassFormState => ({
  className: "",
  academicYearMode: "existing",
  academicYearId: "",
  yearName: "",
  startDate: "",
  endDate: "",
});

function getClassYearLabel(classItem: ClassSummary) {
  const year = classItem.academicYears[0]?.year;
  return year?.yearName ?? "—";
}

export default function AdminClassesPage() {
  useRequireAuth(["ADMIN"]);

  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClassFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadClasses = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchClasses(targetPage, 10);
      setClasses(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load classes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAcademicYears = useCallback(async () => {
    try {
      const result = await fetchAcademicYears(1, 100);
      setAcademicYears(result.data);
    } catch {
      setAcademicYears([]);
    }
  }, []);

  useEffect(() => {
    void loadClasses(page);
  }, [page, loadClasses]);

  useEffect(() => {
    void loadAcademicYears();
  }, [loadAcademicYears]);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm(),
      academicYearMode: academicYears.length > 0 ? "existing" : "new",
      academicYearId: academicYears[0]?.id ?? "",
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function openEdit(id: string) {
    setFormError(null);
    setEditingId(id);

    try {
      const classData = await fetchClass(id);
      setForm({
        className: classData.className,
        academicYearMode: "existing",
        academicYearId: classData.academicYears[0]?.year.id ?? "",
        yearName: "",
        startDate: "",
        endDate: "",
      });
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load class.");
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
  }

  function updateField<K extends keyof ClassFormState>(
    key: K,
    value: ClassFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      if (editingId) {
        const payload: UpdateClassInput = {
          className: form.className,
          ...(form.academicYearId
            ? { academicYearId: form.academicYearId }
            : {}),
        };
        await updateClass(editingId, payload);
      } else {
        let payload: CreateClassInput;

        if (form.academicYearMode === "existing") {
          if (!form.academicYearId) {
            throw new ApiError("Select an academic year.", 400);
          }
          payload = {
            className: form.className,
            academicYearId: form.academicYearId,
          };
        } else {
          payload = {
            className: form.className,
            yearName: form.yearName,
            startDate: form.startDate,
            endDate: form.endDate,
          };
        }

        await createClass(payload);
      }

      closeModal();
      await loadClasses(page);
      await loadAcademicYears();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save class.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(classItem: ClassSummary) {
    const confirmed = window.confirm(`Delete class ${classItem.className}?`);
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteClass(classItem.id);
      await loadClasses(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete class.");
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Administration"
        title="Classes"
        description="Manage classes and student assignments."
      />

      {error ? <Alert>{error}</Alert> : null}

      <DataTableCard
        title="All classes"
        description="Browse, create, edit, and remove class records."
        action={
          <Button type="button" onClick={openCreate}>
            Add class
          </Button>
        }
        columns={[
          {
            key: "className",
            header: "Class name",
            cell: (row) => (
              <span className="font-medium text-white">{row.className}</span>
            ),
          },
          {
            key: "academicYear",
            header: "Academic year",
            cell: (row) => getClassYearLabel(row),
          },
          {
            key: "students",
            header: "Students",
            cell: (row) => row.students.length,
          },
          {
            key: "subjects",
            header: "Subjects",
            cell: (row) => row.subjects.length,
          },
          {
            key: "actions",
            header: "Actions",
            className: "w-56",
            cell: (row) => (
              <div className="flex gap-2">
                <Link
                  href={`/admin/classes/${row.id}`}
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
        rows={classes}
        isLoading={isLoading}
        emptyMessage="No classes found."
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />

      <Modal
        open={modalOpen}
        title={editingId ? "Edit class" : "Add class"}
        description={
          editingId
            ? "Update class details and academic year."
            : "Create a new class for the school."
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Class name" htmlFor="className">
            <Input
              id="className"
              required
              value={form.className}
              onChange={(event) => updateField("className", event.target.value)}
            />
          </FormField>

          {editingId ? (
            <FormField label="Academic year" htmlFor="academicYearId">
              <Select
                id="academicYearId"
                value={form.academicYearId}
                onChange={(event) =>
                  updateField("academicYearId", event.target.value)
                }
              >
                <option value="">Select academic year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.yearName} ({toDateInputValue(year.startDate)} –{" "}
                    {toDateInputValue(year.endDate)})
                  </option>
                ))}
              </Select>
            </FormField>
          ) : academicYears.length > 0 ? (
            <>
              <FormField label="Academic year option" htmlFor="academicYearMode">
                <Select
                  id="academicYearMode"
                  value={form.academicYearMode}
                  onChange={(event) =>
                    updateField(
                      "academicYearMode",
                      event.target.value as ClassFormState["academicYearMode"]
                    )
                  }
                >
                  <option value="existing">Use existing academic year</option>
                  <option value="new">Create new academic year</option>
                </Select>
              </FormField>

              {form.academicYearMode === "existing" ? (
                <FormField label="Academic year" htmlFor="academicYearId">
                  <Select
                    id="academicYearId"
                    value={form.academicYearId}
                    onChange={(event) =>
                      updateField("academicYearId", event.target.value)
                    }
                  >
                    <option value="">Select academic year</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.yearName} ({toDateInputValue(year.startDate)} –{" "}
                        {toDateInputValue(year.endDate)})
                      </option>
                    ))}
                  </Select>
                </FormField>
              ) : (
                <>
                  <FormField label="Academic year name" htmlFor="yearName">
                    <Input
                      id="yearName"
                      required
                      placeholder="2025-2026"
                      value={form.yearName}
                      onChange={(event) =>
                        updateField("yearName", event.target.value)
                      }
                    />
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Start date" htmlFor="startDate">
                      <Input
                        id="startDate"
                        type="date"
                        required
                        value={form.startDate}
                        onChange={(event) =>
                          updateField("startDate", event.target.value)
                        }
                      />
                    </FormField>
                    <FormField label="End date" htmlFor="endDate">
                      <Input
                        id="endDate"
                        type="date"
                        required
                        value={form.endDate}
                        onChange={(event) =>
                          updateField("endDate", event.target.value)
                        }
                      />
                    </FormField>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                No academic years found. Create one inline for this class.
              </p>
              <FormField label="Academic year name" htmlFor="yearName">
                <Input
                  id="yearName"
                  required
                  placeholder="2025-2026"
                  value={form.yearName}
                  onChange={(event) => updateField("yearName", event.target.value)}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Start date" htmlFor="startDate">
                  <Input
                    id="startDate"
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(event) =>
                      updateField("startDate", event.target.value)
                    }
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
            </>
          )}

          {formError ? <Alert>{formError}</Alert> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Save changes" : "Create class"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
