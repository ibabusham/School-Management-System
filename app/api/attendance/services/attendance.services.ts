import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/app/utils/errors.utility";
import { findSubjectById } from "@/app/api/subjects/Services/subjects.services";
import { recalculateLearningProgressForStudent } from "@/app/api/learning-progress/services/recalculate-learning-progress";
import { recalculateClassPerformance } from "@/app/api/classes/Services/recalculate-class-performance";
import type {
  AttendanceListQuery,
  AttendanceStatus,
  CreateAttendanceInput,
  UpdateAttendanceInput,
} from "../schemas";
import type { ScopedSubjectIds } from "@/app/api/auth/services/teacher-scope";
import { buildSubjectIdScopeWhere } from "@/app/api/auth/services/teacher-scope";
import { pickDefined } from "@/app/utils/pick-defined";

function attendancePercentageForStatus(status: AttendanceStatus) {
  switch (status) {
    case "PRESENT":
    case "EXCUSED":
      return 100;
    case "LATE":
      return 75;
    case "ABSENT":
      return 0;
  }
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

async function findActiveStudentById(studentId: string) {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      accountStatus: true,
    },
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  return student;
}

async function assertStudentInSubjectClass(studentId: string, subjectId: string) {
  const subject = await findSubjectById(subjectId);
  const student = await findActiveStudentById(studentId);

  if (student.classId !== subject.classId) {
    throw new AppError("Student is not enrolled in this subject's class", 400);
  }

  return { student, subject };
}

async function findAttendanceById(id: string) {
  const attendance = await prisma.attendences.findUnique({
    where: { id },
  });

  if (!attendance) {
    throw new AppError("Attendance record not found", 404);
  }

  return attendance;
}

async function assertNoDuplicateAttendance(
  studentId: string,
  subjectId: string,
  attendanceDate: Date,
  excludeId?: string
) {
  const existing = await prisma.attendences.findFirst({
    where: {
      studentId,
      subjectId,
      attendanceDate: {
        gte: startOfDay(attendanceDate),
        lte: endOfDay(attendanceDate),
      },
      ...(excludeId && { NOT: { id: excludeId } }),
    },
  });

  if (existing) {
    throw new AppError("Attendance already recorded for this student, subject, and date", 409);
  }
}

async function syncMetrics(studentId: string, classId: string | null) {
  await recalculateLearningProgressForStudent(studentId);

  if (classId) {
    await recalculateClassPerformance(classId);
  }
}

export async function createAttendance(input: CreateAttendanceInput) {
  const { student, subject } = await assertStudentInSubjectClass(
    input.studentId,
    input.subjectId
  );
  await assertNoDuplicateAttendance(input.studentId, input.subjectId, input.attendanceDate);

  const attendance = await prisma.attendences.create({
    data: {
      studentId: input.studentId,
      subjectId: input.subjectId,
      attendanceDate: input.attendanceDate,
      attendanceStatus: input.attendanceStatus,
      attendancePercentage: attendancePercentageForStatus(input.attendanceStatus),
    },
  });

  await syncMetrics(student.id, subject.classId);

  return attendance;
}

export async function getAttendance(id: string) {
  return findAttendanceById(id);
}

export async function getAttendanceList(
  query: AttendanceListQuery,
  scopedSubjectIds?: ScopedSubjectIds
) {
  const { page, limit, studentId, subjectId, fromDate, toDate } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...buildSubjectIdScopeWhere(scopedSubjectIds, subjectId),
    ...(studentId && { studentId }),
    ...((fromDate || toDate) && {
      attendanceDate: {
        ...(fromDate && { gte: startOfDay(fromDate) }),
        ...(toDate && { lte: endOfDay(toDate) }),
      },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.attendences.findMany({
      where,
      skip,
      take: limit,
      orderBy: { attendanceDate: "desc" },
    }),
    prisma.attendences.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function updateAttendance(id: string, input: UpdateAttendanceInput) {
  const existing = await findAttendanceById(id);

  const studentId = input.studentId ?? existing.studentId;
  const subjectId = input.subjectId ?? existing.subjectId;
  const attendanceDate = input.attendanceDate ?? existing.attendanceDate;
  const attendanceStatus = input.attendanceStatus ?? existing.attendanceStatus;

  const { student, subject } = await assertStudentInSubjectClass(studentId, subjectId);
  await assertNoDuplicateAttendance(studentId, subjectId, attendanceDate, id);

  const attendance = await prisma.attendences.update({
    where: { id },
    data: {
      ...pickDefined({
        studentId: input.studentId,
        subjectId: input.subjectId,
        attendanceDate: input.attendanceDate,
        attendanceStatus: input.attendanceStatus,
      }),
      attendancePercentage: attendancePercentageForStatus(
        attendanceStatus as AttendanceStatus
      ),
    },
  });

  await syncMetrics(student.id, subject.classId);

  if (existing.studentId !== studentId || existing.subjectId !== subjectId) {
    const previousSubject = await findSubjectById(existing.subjectId);
    await syncMetrics(existing.studentId, previousSubject.classId);
  }

  return attendance;
}

export async function deleteAttendance(id: string) {
  const attendance = await findAttendanceById(id);
  const subject = await findSubjectById(attendance.subjectId);

  await prisma.attendences.delete({
    where: { id },
  });

  await syncMetrics(attendance.studentId, subject.classId);

  return attendance;
}
