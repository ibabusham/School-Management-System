"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { DataTableCard } from "@/components/admin/data-table-card";
import { FormField } from "@/components/admin/form-field";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { toDateInputValue } from "@/lib/utils/dates";
import { toast } from "sonner";

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
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClassFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["classes", page],
    queryFn: () => fetchClasses(page, 10),
    placeholderData: keepPreviousData,
  });

  const classes = data?.data ?? [];
  const pagination = data?.pagination ?? null;

  const { data: academicYearsData } = useQuery({
    queryKey: ["academicYears", "all"],
    queryFn: () => fetchAcademicYears(1, 100),
    staleTime: 5 * 60_000,
  });
  const academicYears: AcademicYear[] = academicYearsData?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateClassInput | UpdateClassInput) => {
      if (editingId) {
        return updateClass(editingId, payload as UpdateClassInput);
      }
      return createClass(payload as CreateClassInput);
    },
    onSuccess: () => {
      toast.success(editingId ? "Class updated." : "Class created.");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["academicYears"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      toast.success("Class deleted.");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });

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
      setPageError(err instanceof ApiError ? err.message : "Failed to load class.");
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

    try {
      if (editingId) {
        const payload: UpdateClassInput = {
          className: form.className,
          ...(form.academicYearId
            ? { academicYearId: form.academicYearId }
            : {}),
        };
        await saveMutation.mutateAsync(payload);
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

        await saveMutation.mutateAsync(payload);
      }
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save class.");
    }
  }

  async function handleDelete(classItem: ClassSummary) {
    const confirmed = await confirm({
      title: "Delete class",
      description: `Delete class ${classItem.className}? This cannot be undone.`,
    });
    if (!confirmed) {
      return;
    }

    setPageError(null);

    try {
      await deleteMutation.mutateAsync(classItem.id);
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : "Failed to delete class.");
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Administration"
        title="Classes"
        description="Manage classes and student assignments."
      />

      {pageError ? <Alert>{pageError}</Alert> : null}
      {error ? (
        <Alert>
          {error instanceof ApiError ? error.message : "Failed to load classes."}
        </Alert>
      ) : null}

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
        isLoading={isPending}
        emptyMessage="No classes yet."
        emptyDescription="Create a class and assign it to an academic year."
        emptyAction={
          <Button type="button" onClick={openCreate}>
            Add class
          </Button>
        }
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
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editingId ? "Save changes" : "Create class"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
