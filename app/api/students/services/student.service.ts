import { hash } from "bcrypt";
import { randomUUID } from "crypto";

import { prisma } from "@/app/lib/prisma";
import type {
  CreateStudentInput,
  StudentListQuery,
  UpdateStudentInput,
} from "@/app/api/students/schemas";
import type { Student } from "@/prisma/generated/client";
import { Status } from "@/prisma/generated/client";
import { AppError } from "@/app/utils/errors.utility";
import { pickDefined } from "@/app/utils/pick-defined";
import type { JwtPayload } from "@/app/api/auth/services/jwt";
import { assertSelf } from "@/app/api/auth/services/authorize";
import { isAdmin, isStudent, isTeacher } from "@/app/api/auth/services/roles";
import {
  assertStudentInTeacherScope,
  getTeacherClassIds,
} from "@/app/api/auth/services/teacher-scope";

function toSafeStudent(
  student: Student & {
    class?: { id: string; className: string } | null;
    user?: { username: string };
  }
) {
  const { ...safeStudent } = student;
  return safeStudent;
}
export async function createStudent(data: CreateStudentInput) {
  const hashedPassword = await hash(data.password, 10);
  const existingUser = await prisma.user.findUnique({ where: { username: data.username } });
  const existing = await prisma.student.findUnique({
    where: {
      studentId: data.studentId,
    },
  });
  if (existing) {
    throw new AppError("Student id already exists", 400);
  }

  if (existingUser) throw new AppError("Username already exists", 400);

  const student = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: `${data.firstName} ${data.lastName}`,
        username: data.username,
        password: hashedPassword,
        role: "STUDENT",
        accountStatus: true,
      },
    });

    const learningProgress = await tx.learningProgresses.create({
      data: {
        id: randomUUID(),
        subjectsAverages: 0,
        overallAvreages: 0,
        attendencePercentage: 0,
        learningStatus: Status.ACTIVE,
      },
    });

    return tx.student.create({
      data: {
        id: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        studentId: data.studentId,
        email: data.email,
        phoneNumber: data.phoneNumber ?? " ",
        dateOfBirth: data.dateOfBirth,
        enrollmentDate: data.enrollmentDate,
        gender: data.gender,
        accountStatus: true,
        learningProgressId: learningProgress.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            accountStatus: true,
            createdAt: true,
          },
        },
        learningProgress: true,
      },
    });
  });

  return student;
}
export async function updateStudent(studentId: string, data: UpdateStudentInput) {
  await findActiveStudentById(studentId);
  return prisma.student.update({
    where: { id: studentId },
    data: pickDefined(data),
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          accountStatus: true,
          createdAt: true,
        },
     
    }, 
    learningProgress: true,
    },
  });
}
export async function deleteStudent(studentId: string) {
  await findActiveStudentById(studentId);

  const student = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: studentId },
      data: { accountStatus: false },
    });

    return tx.student.update({
      where: { id: studentId },
      data: { accountStatus: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            accountStatus: true,
            createdAt: true,
          },
        },
      },
    });
  });
  return student;
}
export async function listStudents(query: StudentListQuery, auth: JwtPayload) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where: { accountStatus: true; classId?: { in: string[] } } = {
    accountStatus: true,
  };

  if (isTeacher(auth)) {
    const classIds = await getTeacherClassIds(auth.sub);
    // Empty in:[] returns no rows — a teacher with no subjects sees no students.
    where.classId = { in: classIds };
  } else if (!isAdmin(auth)) {
    throw new AppError("Access denied", 403);
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { user: { createdAt: "desc" } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            accountStatus: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.student.count({ where }),
  ]);

  return {
    data: students,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
export async function getStudentById(studentId: string, auth: JwtPayload) {
  if (isStudent(auth)) {
    assertSelf(auth, studentId);
  } else if (isTeacher(auth)) {
    await assertStudentInTeacherScope(auth.sub, studentId);
  } else if (!isAdmin(auth)) {
    throw new AppError("Access denied", 403);
  }

  const student = await findActiveStudentById(studentId);
  return toSafeStudent(student);
}
async function findActiveStudentById(studentId: string) {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      accountStatus: true,
    },
    include: {
      class: {
        select: { id: true, className: true },
      },
      user: {
        select: { username: true },
      },
    },
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  return student;
}
