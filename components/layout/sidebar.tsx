/**
 * Left navigation sidebar for authenticated users.
 *
 * - Shows role-specific menu items (admin / teacher / student)
 * - Highlights the active route
 * - Displays user info and logout button
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SchoolMark } from "@/components/brand/school-mark";
import { useAuth } from "@/lib/auth/auth-context";
import type { UserRole } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  roles: UserRole[];
};

/** All nav links — filtered at render time by the logged-in user's role. */
const NAV_ITEMS: NavItem[] = [
  { href: "/admin/students", label: "Students", roles: ["ADMIN"] },
  { href: "/admin/teachers", label: "Teachers", roles: ["ADMIN"] },
  { href: "/admin/classes", label: "Classes", roles: ["ADMIN"] },
  { href: "/admin/subjects", label: "Subjects", roles: ["ADMIN"] },
  { href: "/teacher", label: "Dashboard", roles: ["TEACHER"] },
  { href: "/teacher/exams", label: "Exams", roles: ["TEACHER"] },
  { href: "/teacher/assignments", label: "Assignments", roles: ["TEACHER"] },
  { href: "/student", label: "Dashboard", roles: ["STUDENT"] },
  { href: "/student/profile", label: "My Profile", roles: ["STUDENT"] },
  {
    href: "/student/learning-progress",
    label: "Learning Progress",
    roles: ["STUDENT"],
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  TEACHER: "Teacher",
  STUDENT: "Student",
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  // Build initials from name for the avatar circle (e.g. "John Doe" → "JD")
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="relative flex w-72 shrink-0 flex-col overflow-hidden bg-charcoal text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-burgundy-dark/50 via-charcoal to-ink"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />

      {/* Brand header */}
      <div className="relative z-10 border-b border-sidebar-border px-6 py-6">
        <div className="flex items-center gap-3">
          <SchoolMark className="h-10 w-10 [&>svg]:h-5 [&>svg]:w-5" />
          <div>
            <p className="text-sm font-semibold tracking-tight">
              Shield&apos;s School
            </p>
            <p className="text-xs text-sidebar-muted">Portal</p>
          </div>
        </div>
      </div>

      {/* User profile card */}
      <div className="relative z-10 mx-4 mt-6 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-white ring-1 ring-primary/30">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <span className="mt-1 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 ring-1 ring-primary/30">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Role-filtered navigation links */}
      <nav className="relative z-10 flex flex-1 flex-col gap-1 px-4 py-6">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
          Menu
        </p>
        {items.map((item) => {
          // Mark link active if URL matches exactly or is a child route
          const active =
            pathname === item.href ||
            (item.href !== "/teacher" &&
              item.href !== "/student" &&
              pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-white shadow-sm shadow-primary/20"
                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative z-10 border-t border-sidebar-border p-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => void logout()}
        >
          Log out
        </Button>
      </div>
    </aside>
  );
}
