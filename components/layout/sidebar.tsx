/**
 * Left navigation sidebar for authenticated users.
 *
 * - Shows role-specific menu items (admin / teacher / student)
 * - Nested folders (e.g. Settings > Change Password)
 * - Highlights the active route
 * - Displays user info and logout button
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  FileText,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  NotebookPen,
  School,
  Settings,
  TrendingUp,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { SchoolMark } from "@/components/brand/school-mark";
import { useAuth } from "@/lib/auth/auth-context";
import type { UserRole } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";

type NavLink = {
  href: string;
  label: string;
  roles: UserRole[];
  icon: LucideIcon;
};

type NavFolder = {
  id: string;
  label: string;
  roles: UserRole[];
  icon: LucideIcon;
  children: NavLink[];
};

type NavEntry = NavLink | NavFolder;

function isFolder(entry: NavEntry): entry is NavFolder {
  return "children" in entry;
}

/** All nav links — filtered at render time by the logged-in user's role. */
const NAV_ITEMS: NavEntry[] = [
  { href: "/admin", label: "Dashboard", roles: ["ADMIN"], icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", roles: ["ADMIN"], icon: Users },
  { href: "/admin/teachers", label: "Teachers", roles: ["ADMIN"], icon: GraduationCap },
  { href: "/admin/classes", label: "Classes", roles: ["ADMIN"], icon: School },
  {
    href: "/admin/academic-years",
    label: "Academic Years",
    roles: ["ADMIN"],
    icon: CalendarRange,
  },
  { href: "/admin/subjects", label: "Subjects", roles: ["ADMIN"], icon: BookOpen },
  { href: "/admin/terms", label: "Terms", roles: ["ADMIN"], icon: CalendarDays },
  { href: "/teacher", label: "Dashboard", roles: ["TEACHER"], icon: LayoutDashboard },
  { href: "/teacher/students", label: "Students", roles: ["TEACHER"], icon: Users },
  { href: "/teacher/exams", label: "Exams", roles: ["TEACHER"], icon: ClipboardCheck },
  {
    href: "/teacher/assignments",
    label: "Assignments",
    roles: ["TEACHER"],
    icon: FileText,
  },
  { href: "/teacher/lessons", label: "Lessons", roles: ["TEACHER"], icon: NotebookPen },
  {
    href: "/teacher/attendance",
    label: "Attendance",
    roles: ["TEACHER"],
    icon: UserCheck,
  },
  { href: "/student", label: "Dashboard", roles: ["STUDENT"], icon: LayoutDashboard },
  { href: "/student/profile", label: "My Profile", roles: ["STUDENT"], icon: User },
  {
    href: "/student/learning-progress",
    label: "Learning Progress",
    roles: ["STUDENT"],
    icon: TrendingUp,
  },
  {
    id: "settings",
    label: "Settings",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    icon: Settings,
    children: [
      {
        href: "/settings/change-password",
        label: "Change Password",
        roles: ["ADMIN", "TEACHER", "STUDENT"],
        icon: KeyRound,
      },
    ],
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
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    settings: true,
  });

  if (!user) {
    return null;
  }

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  function isActive(href: string) {
    return (
      pathname === href ||
      (href !== "/admin" &&
        href !== "/teacher" &&
        href !== "/student" &&
        href !== "/settings" &&
        pathname.startsWith(`${href}/`))
    );
  }

  function toggleFolder(id: string) {
    setOpenFolders((current) => ({ ...current, [id]: !current[id] }));
  }

  function linkClass(href: string) {
    return `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive(href)
        ? "bg-primary text-white shadow-sm shadow-primary/20"
        : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
    }`;
  }

  // Build initials from name for the avatar circle (e.g. "John Doe" → "JD")
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col overflow-hidden bg-charcoal text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/40 via-charcoal to-ink"
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
      <nav className="relative z-10 flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
          Menu
        </p>
        {items.map((item) => {
          if (isFolder(item)) {
            const children = item.children.filter((child) =>
              child.roles.includes(user.role)
            );
            const folderOpen =
              openFolders[item.id] ||
              children.some((child) => isActive(child.href));

            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => toggleFolder(item.id)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                    {item.label}
                  </span>
                  <span
                    className={`text-xs transition-transform ${
                      folderOpen ? "rotate-90" : ""
                    }`}
                    aria-hidden
                  >
                    ▸
                  </span>
                </button>
                {folderOpen ? (
                  <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-white/10 pl-2">
                    {children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={linkClass(child.href)}
                      >
                        <child.icon className="h-4 w-4 shrink-0" aria-hidden />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              <item.icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative z-10 mt-auto shrink-0 border-t border-sidebar-border p-4">
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
