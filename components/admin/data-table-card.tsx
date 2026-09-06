/**
 * Paginated data table inside a Card — used on admin CRUD pages.
 *
 * Generic over row type T (must have an `id` field).
 * Parent page owns data fetching, pagination state, and column definitions.
 *
 * @example
 * <DataTableCard
 *   title="All students"
 *   columns={[{ key: "name", header: "Name", cell: (row) => row.firstName }]}
 *   rows={students}
 *   pagination={pagination}
 *   page={page}
 *   onPageChange={setPage}
 *   ...
 * />
 */
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Pagination } from "@/lib/auth/types";

/** Defines one column: header text + how to render each row's cell. */
type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

export function DataTableCard<T extends { id: string }>({
  title,
  description,
  action,
  columns,
  rows,
  isLoading,
  emptyMessage,
  pagination,
  page,
  onPageChange,
}: {
  title: string;
  description: string;
  /** Optional slot for header actions (e.g. "Add student" button). */
  action?: React.ReactNode;
  columns: Column<T>[];
  rows: T[];
  isLoading: boolean;
  emptyMessage: string;
  pagination: Pagination | null;
  page: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <Card className="overflow-hidden">
      {/* Table header with title and optional action button */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <p className="mt-0.5 text-xs text-sidebar-muted">{description}</p>
        </div>
        {action}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left font-medium text-sidebar-muted ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sidebar-muted"
                >
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sidebar-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-white/5">
                  {columns.map((column) => (
                    <td key={column.key} className={`px-4 py-3 ${column.className ?? ""}`}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
          <p className="text-sm text-sidebar-muted">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total}{" "}
            total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={page >= pagination.totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
