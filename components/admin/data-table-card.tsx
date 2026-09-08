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
import { EmptyState } from "@/components/ui/empty-state";
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
  emptyDescription,
  emptyAction,
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
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  pagination: Pagination | null;
  page: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <Card className="overflow-hidden">
      {/* Table header with title and optional action button */}
      <div className="flex flex-col items-center gap-4 border-b border-white/10 px-8 py-6 text-center">
        <div>
          <h2 className="text-lg font-extrabold text-white">{title}</h2>
          <p className="mt-1 text-sm font-bold text-sidebar-muted">{description}</p>
        </div>
        {action}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm font-bold">
          <thead className="bg-white/5">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-center font-extrabold text-sidebar-muted ${column.className ?? ""}`}
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
                  className="px-6 py-10 text-center font-bold text-sidebar-muted"
                >
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10">
                  <EmptyState
                    title={emptyMessage}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-white/5">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 text-center [&>div]:mx-auto [&>div]:justify-center ${column.className ?? ""}`}
                    >
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
        <div className="flex flex-col items-center justify-center gap-3 border-t border-white/10 px-8 py-4 sm:flex-row sm:justify-between">
          <p className="text-sm font-bold text-sidebar-muted">
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
