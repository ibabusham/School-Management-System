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

function toSafeStudent(student: Student) {
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
export async function listStudents(query: StudentListQuery) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = { accountStatus: true };

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
export async function getStudentById(studentId: string) {
  const student = await findActiveStudentById(studentId);
  return toSafeStudent(student);
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
