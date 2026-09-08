# Changes since last commit (`660144e`)

**Base:** `660144e feat: add Manage detail pages for students, subjects, and teachers`
**Scope:** 40 files changed, 935 insertions, 228 deletions, plus 3 new components and 1 new page.

This batch is a **UX layer** on top of the already-wired CRUD pages. The API surface barely changed; almost everything is about *how* the UI confirms, notifies, navigates, and looks.

---

## 1. Confirm dialog — replacing `window.confirm`

**What:** Every delete/remove action used the browser's native `window.confirm`, which clashes with the design and can't be styled. We replaced it with an app-wide dialog.

**Why:** Native confirm blocks the main thread, looks like the OS instead of the app, and can't show the record name or a red "Delete" button.

**How it works (the flow):**

1. `components/providers.tsx` wraps the app in `<ConfirmProvider>` (inside `AuthProvider`). This is the *first* thing that happens — the provider must exist before any page calls `useConfirm()`.
2. `ConfirmProvider` holds one piece of state: `dialog = { options, resolve } | null`. `resolve` is the resolver of a Promise it creates on demand.
3. A page calls `const confirm = useConfirm()`, then:

```ts
const confirmed = await confirm({
  title: "Delete class",
  description: `Delete class ${classItem.className}? This cannot be undone.`,
});
```

4. `confirm()` returns a `Promise<boolean>` and stores `{ options, resolve }` in state. Storing the resolver in React state is the key trick — it lets a *user click* resolve a promise that was created earlier.
5. The dialog renders (fixed overlay, `role="alertdialog"`, backdrop click + Escape both call `close(false)`).
6. Clicking **Cancel** resolves `false`; **Delete** resolves `true`. The awaiting `handleDelete` continues only if `confirmed` is true, then runs the API call.

**Files:** `components/ui/confirm-dialog.tsx` (new), `components/providers.tsx`, and all 13 CRUD pages (`admin/*`, `teacher/*`) swapped `window.confirm(...)` for `await confirm({...})`. A `danger` variant was added to `components/ui/button.tsx` for the red Delete button.

---

## 2. Toast notifications (sonner)

**What:** Success feedback used to be inline `<Alert>` text that sat in the page. Now a toast pops up top-right and auto-dismisses.

**Why:** Toasts are transient — they confirm the action without taking up layout space or requiring the user to dismiss them.

**How:**

1. `components/providers.tsx` renders `<Toaster position="top-right" richColors closeButton />` once, next to the page tree.
2. Any component calls `toast.success("Class deleted.")` after a successful mutation. Sonner manages the queue, animation, and dismissal.
3. On grading pages (`teacher/exams/[id]`, `teacher/assignments/[id]`) the old `success` state was removed; `handleSaveMarks` now calls `toast.success(result.message)`. `GradingPanel`'s `successMessage` prop became optional so it still compiles without it.
4. `settings/change-password` and the public forgot/reset pages also toast on success.

**Files:** `components/providers.tsx`, `components/teacher/grading-panel.tsx`, plus every page that performs a create/update/delete.

---

## 3. Breadcrumbs in the page header

**What:** Detail pages show a trail like `Classes / Grade 10A` inside the header card.

**Why:** Users need to know where they are and get back to the parent list without using the sidebar.

**How:**

1. `components/layout/page-header.tsx` accepts an optional `breadcrumbs: { label, href? }[]`.
2. It renders a `<nav aria-label="Breadcrumb">` with an ordered list. All items except the last are `next/link` links; the last is plain text (the current page). A `/` separator is inserted between items.
3. Detail pages pass their trail, e.g. `app/(app)/admin/classes/[id]/page.tsx`:

```tsx
breadcrumbs={[
  { label: "Classes", href: "/admin/classes" },
  { label: classData?.className ?? "Details" },
]}
```

4. Teacher exam/assignment detail pages dropped their old `← Back to exams` links — breadcrumbs replace them. `settings/change-password` got `Settings / Change Password`.

**Files:** `components/layout/page-header.tsx`, all `[id]` detail pages, `settings/change-password/page.tsx`.

---

## 4. Sidebar icons

**What:** Every nav item now has a Lucide icon.

**Why:** Icons make the menu scannable and look more finished than text-only links.

**How:**

1. `NAV_ITEMS` entries gained an `icon: LucideIcon` field (e.g. `Users`, `GraduationCap`, `BookOpen`, `CalendarDays`, `Settings`, `KeyRound`).
2. `linkClass()` now returns `flex items-center gap-2.5 ...` so the icon and label sit in a row.
3. Links render `<item.icon className="h-4 w-4 shrink-0" aria-hidden />` before the label. Folders render the icon inside the toggle button.

**Files:** `components/layout/sidebar.tsx`. New dependency: `lucide-react`.

---

## 5. Dashboard charts (recharts)

**What:** Bar charts on the admin, teacher, and student dashboards, plus class performance.

**Why:** Raw StatCard numbers are hard to compare; a chart makes proportions obvious.

**How:**

1. New `components/dashboard/dashboard-bar-chart.tsx` wraps recharts' `<BarChart>` in `<ResponsiveContainer>`. It reads theme tokens (`fill="var(--color-primary)"`) so bars match the accent color, and styles ticks/tooltip to the dark card palette.
2. If every value is 0, it renders `<EmptyState>` instead of an empty chart.
3. Pages feed it data they already fetch — no new API calls:
   - `admin/page.tsx`: Students / Teachers / Classes / Subjects counts.
   - `teacher/page.tsx`: Subjects / Exams / Assignments counts.
   - `student/page.tsx` and `student/learning-progress/page.tsx`: subject avg, overall avg, attendance %.
   - `admin/classes/[id]/page.tsx`: class avg, attendance rate, assignment completion % (from `fetchClassPerformance`).

**Files:** `components/dashboard/dashboard-bar-chart.tsx` (new), the four dashboard pages, class detail page. New dependency: `recharts`.

---

## 6. Better empty states

**What:** "No terms found." became an icon + title + description + a create button.

**Why:** A bare string looks broken; an empty state with a call-to-action tells the user what to do next.

**How:**

1. New `components/ui/empty-state.tsx`: centered icon (defaults to `Inbox`), bold title, muted description, optional action node.
2. `DataTableCard` accepts `emptyDescription` and `emptyAction`. When `rows.length === 0` it renders `<EmptyState title={emptyMessage} ... />` inside the table cell instead of plain text.
3. List pages pass their existing "Add X" button as `emptyAction`, so an empty table still offers the create action:

```tsx
emptyMessage="No terms yet."
emptyDescription="Create a term inside an academic year."
emptyAction={<Button onClick={openCreate}>Add term</Button>}
```

4. Teacher dashboard lists ("No exams yet") and student notes ("No teacher notes yet") use `EmptyState` directly.

**Files:** `components/ui/empty-state.tsx` (new), `components/admin/data-table-card.tsx`, all list/detail pages with tables.

---

## 7. Theme — red accent + blush-cream background

**What:** The accent went terracotta, then back to **red** (`#ba181b`), with a new **blush-cream** page background (`#f6ece8`).

**Why:** The first red-on-yellow-cream clashed; the terracotta experiment wasn't wanted. Blush cream (a pale warm rose) sits next to red without fighting it.

**How:**

1. `app/globals.css` `@theme` tokens changed: `--color-background: #f6ece8`, `--color-surface: #faf4f2`, `--color-primary: #ba181b`, `--color-card-bg: #1f1416` (dark warm), `--color-card-border: #8a5a5a`, sidebar/border/muted tones adjusted to match.
2. `components/ui/brand-surface.tsx` (the card background) uses `bg-card-bg` with a `from-primary/25` gradient and an `accent/20` glow — so every card, stat tile, and field box picks up the red glow automatically.
3. Sidebar gradient changed from `from-burgundy-dark/50` to `from-primary/40`; the login/auth split layout uses the same red glow.
4. Because buttons, active nav, PageHeader eyebrows, and chart bars all reference `--color-primary`, the whole app re-themed from one file.

**Files:** `app/globals.css`, `components/ui/brand-surface.tsx`, `components/layout/sidebar.tsx`, `components/layout/auth-split-layout.tsx`, `components/ui/card.tsx`, `components/ui/button.tsx`, `components/dashboard/dashboard-bar-chart.tsx`.

---

## 8. Academic Years page (admin)

**What:** New `/admin/academic-years` page with full CRUD.

**Why:** Academic years existed in the API but had no UI; terms and classes depend on them.

**How:**

1. `lib/api/academic-years.ts` gained typed functions: `fetchAcademicYears`, `fetchAcademicYear`, `createAcademicYear`, `updateAcademicYear`, `deleteAcademicYear`.
2. `app/(app)/admin/academic-years/page.tsx` follows the same CRUD pattern as terms: a `DataTableCard`, a modal form (`yearName`, `startDate`, `endDate`), client-side date validation, and the confirm dialog + toast on delete. The "only one ACTIVE year" rule is enforced server-side and surfaced as a form error.
3. Sidebar entry added (`CalendarRange` icon).

**Files:** `lib/api/academic-years.ts`, `app/(app)/admin/academic-years/page.tsx` (new), `components/layout/sidebar.tsx`.

---

## 9. Student profile — more fields

**What:** My Profile went from 4 fields (ID, first/last name, email) to 11.

**Why:** The API already returned the full student record; the page just wasn't showing it.

**How:**

1. Backend — `app/api/students/services/student.service.ts`: `findActiveStudentById` now uses Prisma `include` to join the student's `class` (`id`, `className`) and `user` (`username`). `toSafeStudent`'s type was widened to match. This is needed because students can't call `GET /api/classes/:id` (admin-only), so the class name has to come along with the student record.
2. `lib/api/students.ts`: `StudentDetail` type gained `class?: { id, className } | null` and `user?: { username }`.
3. `app/(app)/student/profile/page.tsx` rewritten to render a grid of `FieldCard`s: Student ID, Username, First/Last name, Gender, Date of birth, Email, Phone, Class, Enrollment date, Account status. Dates go through `formatDate`; gender `MALE/FEMALE` → "Male/Female"; empty phone → "—". A breadcrumb (`Dashboard / My Profile`) and a "View learning progress" link were added.

**Files:** `app/api/students/services/student.service.ts`, `lib/api/students.ts`, `app/(app)/student/profile/page.tsx`.

---

## Order of operations (what happens first, and why)

1. **Providers mount** (`components/providers.tsx`): `AuthProvider` → `ConfirmProvider` → `Toaster`. Auth first because everything depends on the session; Confirm and Toaster before pages so `useConfirm()`/`toast` exist.
2. **Page mounts** → `useRequireAuth` checks the session → data fetching hooks run.
3. **User clicks Delete** → `await confirm(...)` opens the dialog and *pauses* the handler → user clicks Delete in the dialog → promise resolves `true` → API call runs → on success `toast.success(...)` fires and the list reloads.
4. **Rendering** → `PageHeader` (with breadcrumbs) → `StatCard`s / `DashboardBarChart` → `DataTableCard` (which shows `EmptyState` when there are no rows).

## New dependencies

- `lucide-react` — sidebar and empty-state icons
- `sonner` — toast notifications
- `recharts` — dashboard bar charts
