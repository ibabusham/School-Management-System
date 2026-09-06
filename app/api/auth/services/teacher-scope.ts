import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/app/utils/errors.utility";
import { Role } from "@/prisma/generated/client";
import type { JwtPayload } from "./jwt";
import { isAdmin } from "./roles";


async function findSubjectOwnedByTeacher(teacherId: string, subjectId: string) {
  return prisma.subjects.findFirst({
    where: { id: subjectId, teacherId },
    select: { id: true, classId: true },
  });
}

async function assertTeacherOwnsSubjectId(teacherId: string, subjectId: string) {
  const subject = await findSubjectOwnedByTeacher(teacherId, subjectId);

  if (!subject) {
    throw new AppError("You do not have access to this subject", 403);
  }

  return subject;
}

async function assertTeacherOwnsResourceBySubjectId(
  teacherId: string,
  subjectId: string,
  resourceLabel: string
) {
  const subject = await findSubjectOwnedByTeacher(teacherId, subjectId);

  if (!subject) {
    throw new AppError(`You do not have access to this ${resourceLabel}`, 403);
  }

  return subject;
}

function assertTeacherRole(payload: JwtPayload) {
  if (payload.role !== Role.TEACHER) {
    throw new AppError("Teacher access required", 403);
  }
}


export async function getTeacherSubjectIds(teacherId: string) {
  const subjects = await prisma.subjects.findMany({
    where: { teacherId },
    select: { id: true },
  });

  return subjects.map((subject) => subject.id);
}


export async function getTeacherClassIds(teacherId: string) {
  const subjects = await prisma.subjects.findMany({
    where: { teacherId },
    select: { classId: true },
  });

  return [...new Set(subjects.map((subject) => subject.classId))];
}



export type ScopedSubjectIds = string[] | undefined;

export async function getScopedSubjectIds(payload: JwtPayload): Promise<ScopedSubjectIds> {
  if (isAdmin(payload)) {
    return undefined;
  }

  return getTeacherSubjectIds(payload.sub);
}

export function buildSubjectIdScopeWhere(
  scopedSubjectIds: ScopedSubjectIds,
  requestedSubjectId?: string
) {
  if (scopedSubjectIds === undefined) {
    return requestedSubjectId ? { subjectId: requestedSubjectId } : {};
  }

  if (scopedSubjectIds.length === 0) {
    return { subjectId: { in: [] as string[] } };
  }

  if (requestedSubjectId) {
    if (!scopedSubjectIds.includes(requestedSubjectId)) {
      throw new AppError("You do not have access to this subject", 403);
    }

    return { subjectId: requestedSubjectId };
  }

  return { subjectId: { in: scopedSubjectIds } };
}

export async function assertTeacherOwnsSubject(teacherId: string, subjectId: string) {
  await assertTeacherOwnsSubjectId(teacherId, subjectId);
}

export async function assertTeacherOwnsExam(teacherId: string, examId: string) {
  const exam = await prisma.exams.findUnique({
    where: { id: examId },
    select: { subjectId: true },
  });

  if (!exam) {
    throw new AppError("Exam not found", 404);
  }

  await assertTeacherOwnsResourceBySubjectId(teacherId, exam.subjectId, "exam");
}

export async function assertTeacherOwnsAssignment(teacherId: string, assignmentId: string) {
  const assignment = await prisma.assignments.findUnique({
    where: { id: assignmentId },
    select: { subjectId: true },
  });

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  await assertTeacherOwnsResourceBySubjectId(
    teacherId,
    assignment.subjectId,
    "assignment"
  );
}

export async function assertTeacherOwnsLesson(teacherId: string, lessonId: string) {
  const lesson = await prisma.lessons.findUnique({
    where: { id: lessonId },
    select: { subjectId: true },
  });

  if (!lesson) {
    throw new AppError("Lesson not found", 404);
  }

  await assertTeacherOwnsResourceBySubjectId(teacherId, lesson.subjectId, "lesson");
}

export async function assertTeacherOwnsAttendance(teacherId: string, attendanceId: string) {
  const attendance = await prisma.attendences.findUnique({
    where: { id: attendanceId },
    select: { subjectId: true },
  });

  if (!attendance) {
    throw new AppError("Attendance record not found", 404);
  }

  await assertTeacherOwnsResourceBySubjectId(
    teacherId,
    attendance.subjectId,
    "attendance record"
  );
}

export async function assertStudentInTeacherScope(teacherId: string, studentId: string) {
  const classIds = await getTeacherClassIds(teacherId);

  if (classIds.length === 0) {
    throw new AppError("You do not have access to this student", 403);
  }

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      accountStatus: true,
      classId: { in: classIds },
    },
    select: { id: true },
  });

  if (!student) {
    throw new AppError("You do not have access to this student", 403);
  }
}

export async function assertTeacherOwnsClass(teacherId: string, classId: string) {
  const classIds = await getTeacherClassIds(teacherId);

  if (!classIds.includes(classId)) {
    throw new AppError("You do not have access to this class", 403);
  }
}


export async function requireTeacherOwnsSubject(payload: JwtPayload, subjectId: string) {
  if (isAdmin(payload)) return;
  assertTeacherRole(payload);
  await assertTeacherOwnsSubject(payload.sub, subjectId);
}

export async function requireTeacherOwnsExam(payload: JwtPayload, examId: string) {
  if (isAdmin(payload)) return;
  assertTeacherRole(payload);
  await assertTeacherOwnsExam(payload.sub, examId);
}

export async function requireTeacherOwnsAssignment(payload: JwtPayload, assignmentId: string) {
  if (isAdmin(payload)) return;
  assertTeacherRole(payload);
  await assertTeacherOwnsAssignment(payload.sub, assignmentId);
}

export async function requireTeacherOwnsLesson(payload: JwtPayload, lessonId: string) {
  if (isAdmin(payload)) return;
  assertTeacherRole(payload);
  await assertTeacherOwnsLesson(payload.sub, lessonId);
}

export async function requireTeacherOwnsAttendance(payload: JwtPayload, attendanceId: string) {
  if (isAdmin(payload)) return;
  assertTeacherRole(payload);
  await assertTeacherOwnsAttendance(payload.sub, attendanceId);
}

export async function requireStudentInTeacherScope(payload: JwtPayload, studentId: string) {
  if (isAdmin(payload)) return;
  assertTeacherRole(payload);
  await assertStudentInTeacherScope(payload.sub, studentId);
}

export async function requireTeacherOwnsClass(payload: JwtPayload, classId: string) {
  if (isAdmin(payload)) return;
  assertTeacherRole(payload);
  await assertTeacherOwnsClass(payload.sub, classId);
}
