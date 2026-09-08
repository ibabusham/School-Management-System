/**
 * Left navigation sidebar for authenticated users.
 *
 * - Shows role-specific menu items (admin / teacher / student)
 * - Nested folders (e.g. Settings > Change Password)
 * - Collapses to an icons-only rail with hover tooltips and flyout menus
 * - Highlights the active route
 * - Displays user info and logout button
 */
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
  LogOut,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
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

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

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

/**
 * Hover popover for the collapsed rail.
 * Renders in a portal so it isn't clipped by the sidebar's overflow.
 * Tooltips are label-only; folders pass a flyout panel of child links.
 */
function SidebarPopper({
  collapsed,
  tooltip,
  flyout,
  children,
}: {
  collapsed: boolean;
  tooltip: string;
  flyout?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const closeTimer = useRef<number | null>(null);

  function cancelClose() {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openAt(el: HTMLElement) {
    if (!collapsed) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const estimatedHeight = flyout ? 96 : 36;
    const top = Math.min(
      Math.max(8, rect.top),
      window.innerHeight - estimatedHeight - 8
    );
    setPos({ top, left: rect.right + 8 });
    setOpen(true);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  }

  useEffect(() => {
    return () => cancelClose();
  }, []);

  useEffect(() => {
    if (!collapsed) {
      setOpen(false);
    }
  }, [collapsed]);

  return (
    <>
      <div
        onMouseEnter={(event) => {
          cancelClose();
          openAt(event.currentTarget);
        }}
        onMouseLeave={scheduleClose}
      >
        {children}
      </div>
      {collapsed && open
        ? createPortal(
            <div
              className="fixed z-[80]"
              style={{ top: pos.top, left: pos.left }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              {flyout ?? (
                <div className="pointer-events-none whitespace-nowrap rounded-md border border-white/10 bg-ink px-2.5 py-1.5 text-xs font-bold text-white shadow-lg">
                  {tooltip}
                </div>
              )}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    settings: true,
  });
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

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

  function linkClass(href: string, iconOnly = false) {
    return `flex items-center rounded-lg text-sm font-medium transition-colors ${
      iconOnly ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2.5"
    } ${
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
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden bg-charcoal text-white transition-[width] duration-200 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/40 via-charcoal to-ink"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />

      {/* Brand header */}
      <div
        className={`relative z-10 border-b border-sidebar-border py-6 ${
          collapsed ? "px-2" : "px-6"
        }`}
      >
        <div className="flex items-center justify-center gap-3">
          <SchoolMark className="h-10 w-10 [&>svg]:h-5 [&>svg]:w-5" />
          {collapsed ? null : (
            <div>
              <p className="text-sm font-semibold tracking-tight">
                Shield&apos;s School
              </p>
              <p className="text-xs text-sidebar-muted">Portal</p>
            </div>
          )}
        </div>
      </div>

      {/* User profile card */}
      <SidebarPopper
        collapsed={collapsed}
        tooltip={`${user.name} · ${ROLE_LABELS[user.role]}`}
      >
        <div
          className={`relative z-10 mt-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm ${
            collapsed ? "mx-2 p-2" : "mx-4 p-4"
          }`}
        >
          <div
            className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-white ring-1 ring-primary/30">
              {initials}
            </div>
            {collapsed ? null : (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <span className="mt-1 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 ring-1 ring-primary/30">
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            )}
          </div>
        </div>
      </SidebarPopper>

      {/* Role-filtered navigation links */}
      <nav
        className={`relative z-10 flex flex-1 flex-col gap-1 overflow-y-auto py-6 ${
          collapsed ? "px-2" : "px-4"
        }`}
      >
        {collapsed ? null : (
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
            Menu
          </p>
        )}
        {items.map((item) => {
          if (isFolder(item)) {
            const children = item.children.filter((child) =>
              child.roles.includes(user.role)
            );
            const folderHasActive = children.some((child) => isActive(child.href));
            const folderOpen =
              openFolders[item.id] || folderHasActive;

            const flyout = (
              <div className="min-w-48 rounded-xl border border-white/10 bg-charcoal p-2 shadow-xl">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
                  {item.label}
                </p>
                <div className="mt-1 flex flex-col gap-1">
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
              </div>
            );

            return (
              <SidebarPopper
                key={item.id}
                collapsed={collapsed}
                tooltip={item.label}
                flyout={flyout}
              >
                <div>
                  <button
                    type="button"
                    aria-expanded={collapsed ? undefined : folderOpen}
                    aria-label={item.label}
                    onClick={() => {
                      if (!collapsed) {
                        toggleFolder(item.id);
                      }
                    }}
                    className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition-colors ${
                      collapsed
                        ? "justify-center px-0"
                        : "justify-between px-3"
                    } ${
                      folderHasActive
                        ? "bg-primary/30 text-white"
                        : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
                    }`}
                  >
                    <span className={`flex items-center ${collapsed ? "" : "gap-2.5"}`}>
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                      {collapsed ? null : item.label}
                    </span>
                    {collapsed ? null : (
                      <span
                        className={`text-xs transition-transform ${
                          folderOpen ? "rotate-90" : ""
                        }`}
                        aria-hidden
                      >
                        ▸
                      </span>
                    )}
                  </button>
                  {!collapsed && folderOpen ? (
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
              </SidebarPopper>
            );
          }

          return (
            <SidebarPopper key={item.href} collapsed={collapsed} tooltip={item.label}>
              <Link
                href={item.href}
                aria-label={item.label}
                className={linkClass(item.href, collapsed)}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                {collapsed ? null : item.label}
              </Link>
            </SidebarPopper>
          );
        })}
      </nav>

      <div
        className={`relative z-10 mt-auto shrink-0 border-t border-sidebar-border ${
          collapsed ? "p-2" : "p-4"
        }`}
      >
        <div className="flex flex-col gap-2">
          <SidebarPopper
            collapsed={collapsed}
            tooltip={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Button
              variant="ghost"
              className={`w-full ${collapsed ? "px-0" : "justify-start gap-2"}`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={toggleCollapsed}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  Collapse
                </>
              )}
            </Button>
          </SidebarPopper>
          <SidebarPopper collapsed={collapsed} tooltip="Log out">
            <Button
              variant="outline"
              className={`w-full ${collapsed ? "px-0" : ""}`}
              aria-label="Log out"
              onClick={() => void logout()}
            >
              {collapsed ? <LogOut className="h-4 w-4" /> : "Log out"}
            </Button>
          </SidebarPopper>
        </div>
      </div>
    </aside>
  );
}
