/**
 * Shield's School logo mark (graduation cap icon).
 *
 * Used in the login page brand panel and sidebar header.
 * Pass className to resize — e.g. className="h-14 w-14"
 */
export function SchoolMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-6 w-6 text-white"
        aria-hidden
      >
        <path
          d="M12 3L2 9l10 6 10-6-10-6z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M22 9v6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
