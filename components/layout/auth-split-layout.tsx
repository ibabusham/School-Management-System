/**
 * Shared two-panel layout for public auth pages (login, forgot, reset).
 *
 * Left: brand panel (hidden on small screens).
 * Right: form content via children.
 */
import { SchoolMark } from "@/components/brand/school-mark";

export function AuthSplitLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[58%] shrink-0 overflow-hidden bg-charcoal lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-burgundy-dark/80 via-charcoal to-ink"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-crimson/15 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 ml-18 flex flex-1 flex-col items-start justify-center pl-14 pr-28 text-left xl:pl-20 xl:pr-40">
          <SchoolMark className="h-14 w-14 [&>svg]:h-7 [&>svg]:w-7" />
          <h1 className="mt-8 text-5xl font-semibold tracking-tight text-white xl:text-6xl">
            Shield&apos;s
            <br />
            <span className="text-white/90">School</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-sidebar-muted">
            A unified portal for administrators, teachers, and students to manage
            academics, attendance, and progress — all in one place.
          </p>

          <ul className="mt-12 space-y-5">
            {[
              "Role-based dashboards for every user",
              "Secure access to grades and assignments",
              "Real-time learning progress tracking",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3.5 text-base text-white/80"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 ring-1 ring-primary/40">
                  <svg
                    viewBox="0 0 12 12"
                    className="h-3 w-3 text-accent"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M10.28 2.28a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2.5-2.5a1 1 0 1 1 1.414-1.414L4.5 6.836l4.293-4.293a1 1 0 0 1 1.487.737z" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 px-14 py-8 text-xs text-sidebar-muted xl:px-20">
          &copy; {new Date().getFullYear()} Shield&apos;s School
        </p>
      </aside>

      <main className="flex flex-1 flex-col justify-center bg-background px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 lg:mb-12">
            <div className="flex items-center gap-3 lg:hidden">
              <SchoolMark className="h-10 w-10" />
              <span className="text-lg font-semibold tracking-tight text-foreground">
                Shield&apos;s School
              </span>
            </div>

            <div className="mt-8 text-center lg:mt-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {eyebrow}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
