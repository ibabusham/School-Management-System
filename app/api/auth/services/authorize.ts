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
