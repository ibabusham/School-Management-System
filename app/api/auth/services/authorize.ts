import { AppError } from "@/app/utils/errors.utility";
import type { JwtPayload } from "@/app/api/auth/services/jwt";
import { isAdmin, isStudent, isTeacher } from "./roles";
import { requireStudentInTeacherScope, requireTeacherOwnsClass } from "./teacher-scope";


export { isAdmin, isStudent, isTeacher } from "./roles";


export function assertAdmin(payload: JwtPayload) {
  if (!isAdmin(payload)) {
    throw new AppError("Admin access required", 403);
  }
}


export function assertTeacherOrAdmin(payload: JwtPayload) {
  if (!isTeacher(payload) && !isAdmin(payload)) {
    throw new AppError("Teacher or admin access required", 403);
  }
}


export function assertSelf(payload: JwtPayload, resourceUserId: string) {
  if (payload.sub !== resourceUserId) {
    throw new AppError("You can only access your own account", 403);
  }
}

export const assertSelfAccess = assertSelf;

export function assertStudentAccess(payload: JwtPayload, studentId: string) {
  if (isStudent(payload) && payload.sub !== studentId) {
    throw new AppError("You can only access your own learning progress", 403);
  }
}


export function assertNotStudent(payload: JwtPayload) {
  if (isStudent(payload)) {
    throw new AppError("Students cannot access this resource", 403);
  }
}


export async function assertLearningProgressReadAccess(
  payload: JwtPayload,
  studentId: string
) {
  if (isAdmin(payload)) {
    return;
  }

  if (isStudent(payload)) {
    assertSelf(payload, studentId);
    return;
  }

  if (isTeacher(payload)) {
    await requireStudentInTeacherScope(payload, studentId);
    return;
  }

  throw new AppError("Access denied", 403);
}

/**
 * POST progress note
 * - ADMIN: any student (must pass teacherId in body)
 * - TEACHER: student in class scope; note is authored as the logged-in teacher
 * - STUDENT: denied
 */
export async function assertProgressNoteCreateAccess(
  payload: JwtPayload,
  studentId: string
) {
  // RBAC: students cannot create progress notes
  assertNotStudent(payload);
  assertTeacherOrAdmin(payload);

  if (isTeacher(payload)) {
    await requireStudentInTeacherScope(payload, studentId);
  }
}

/**
 * PATCH/DELETE progress note
 * - ADMIN: any note
 * - TEACHER: must be note author and student must be in class scope
 * - STUDENT: denied
 */
export async function assertProgressNoteModifyAccess(
  payload: JwtPayload,
  studentId: string,
  noteTeacherId: string
) {
  // RBAC: students cannot modify progress notes
  assertNotStudent(payload);

  if (isAdmin(payload)) {
    return;
  }

  if (isTeacher(payload)) {
    assertSelf(payload, noteTeacherId);
    await requireStudentInTeacherScope(payload, studentId);
    return;
  }

  throw new AppError("Access denied", 403);
}

export function assertCalendarReadAccess(payload: JwtPayload) {
  if (isAdmin(payload) || isTeacher(payload) || isStudent(payload)) {
    return;
  }

  throw new AppError("Access denied", 403);
}

export async function assertStudentProfileReadAccess(
  payload: JwtPayload,
  studentId: string
) {
  if (isAdmin(payload)) {
    return;
  }

  if (isStudent(payload)) {
    assertSelf(payload, studentId);
    return;
  }

  if (isTeacher(payload)) {
    await requireStudentInTeacherScope(payload, studentId);
    return;
  }

  throw new AppError("Access denied", 403);
}

export function assertTeacherProfileReadAccess(payload: JwtPayload, teacherId: string) {
  if (isAdmin(payload)) {
    return;
  }

  if (isTeacher(payload)) {
    assertSelf(payload, teacherId);
    return;
  }

  throw new AppError("Access denied", 403);
}

export function assertTeacherProfileWriteAccess(payload: JwtPayload, teacherId: string) {
  if (isAdmin(payload)) {
    return;
  }

  if (isTeacher(payload)) {
    assertSelf(payload, teacherId);
    return;
  }

  throw new AppError("Access denied", 403);
}

export async function assertClassPerformanceReadAccess(
  payload: JwtPayload,
  classId: string
) {
  if (isAdmin(payload)) {
    return;
  }

  if (isTeacher(payload)) {
    await requireTeacherOwnsClass(payload, classId);
    return;
  }

  throw new AppError("Access denied", 403);
}
