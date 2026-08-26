import { randomUUID } from "crypto";
import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/app/utils/errors.utility";
import type { CreateClassInput, UpdateClassInput, GetClassListQueryInput } from "../schemas";

const classInclude = {
  academicYears: { include: { year: true } },
  students: true,
  subjects: true,
} as const;

async function findClassById(id: string) {
  const classRecord = await prisma.classes.findUnique({
    where: { id },
  });

  if (!classRecord) {
    throw new AppError("Class not found", 404);
  }

  return classRecord;
}

async function findAcademicYearById(id: string) {
  const academicYear = await prisma.academicYears.findUnique({
    where: { id },
  });

  if (!academicYear) {
    throw new AppError("Academic year not found", 404);
  }

  return academicYear;
}

const studentInclude = {
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
} as const;

export async function assignStudentsToClass(classId: string, studentIds: string[]) {
  const classRecord = await findClassById(classId);

  const uniqueStudentIds = [...new Set(studentIds)];
  const students = await prisma.student.findMany({
    where: {
      id: { in: uniqueStudentIds },
      accountStatus: true,
    },
  });

  if (students.length !== uniqueStudentIds.length) {
    const foundIds = new Set(students.map((student) => student.id));
    const missingIds = uniqueStudentIds.filter((id) => !foundIds.has(id));
    throw new AppError(`Student(s) not found: ${missingIds.join(", ")}`, 404);
  }

  await prisma.student.updateMany({
    where: { id: { in: uniqueStudentIds } },
    data: { classId },
  });

  const updatedStudents = await prisma.student.findMany({
    where: { id: { in: uniqueStudentIds } },
    include: studentInclude,
  });

  return {
    classId,
    className: classRecord.className,
    students: updatedStudents,
    assignedCount: updatedStudents.length,
  };
}

export async function unassignStudentFromClass(classId: string, studentId: string) {
  await findClassById(classId);

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      classId,
      accountStatus: true,
    },
  });

  if (!student) {
    throw new AppError("Student not found in this class", 404);
  }

  const updatedStudent = await prisma.student.update({
    where: { id: studentId },
    data: { classId: null },
    include: studentInclude,
  });

  return { student: updatedStudent };
}

export async function createClass(data: CreateClassInput) {
  let yearId: string;

  if (data.academicYearId) {
    await findAcademicYearById(data.academicYearId);
    yearId = data.academicYearId;
  } else {
    const academicYear = await prisma.academicYears.create({
      data: {
        id: randomUUID(),
        yearName: data.yearName!,
        startDate: data.startDate!,
        endDate: data.endDate!,
        status: "ACTIVE",
      },
    });
    yearId = academicYear.id;
  }

  return prisma.classes.create({
    data: {
      id: randomUUID(),
      className: data.className,
      academicYears: {
        create: {
          year: {
            connect: { id: yearId },
          },
        },
      },
    },
    include: classInclude,
  });
}

export async function updateClass(classId: string, data: UpdateClassInput) {
  await findClassById(classId);

  if (data.academicYearId) {
    await findAcademicYearById(data.academicYearId);
  }

  return prisma.$transaction(async (tx) => {
    if (data.academicYearId) {
      await tx.classAcademicYear.deleteMany({ where: { classId } });
      await tx.classAcademicYear.create({
        data: {
          classId,
          yearId: data.academicYearId,
        },
      });
    }

    return tx.classes.update({
      where: { id: classId },
      data: {
        ...(data.className && { className: data.className }),
      },
      include: classInclude,
    });
  });
}

export async function deleteClass(id: string) {
  await findClassById(id);

  return prisma.classes.delete({
    where: { id },
  });
}

export async function getClassById(id: string) {
  const classRecord = await prisma.classes.findUnique({
    where: { id },
    include: classInclude,
  });

  if (!classRecord) {
    throw new AppError("Class not found", 404);
  }

  return classRecord;
}

export async function getClassList(data: GetClassListQueryInput) {
  const { page, limit } = data;
  const skip = (page - 1) * limit;

  const [classes, total] = await Promise.all([
    prisma.classes.findMany({
      skip,
      take: limit,
      include: classInclude,
      orderBy: { className: "asc" },
    }),
    prisma.classes.count(),
  ]);

  return {
    data: classes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getClassPerformance(classId: string) {
  await findClassById(classId);

  const performance = await prisma.classesPerformence.findUnique({
    where: { classId },
  });

  if (!performance) {
    throw new AppError("Class performance not found", 404);
  }

  return performance;
}
