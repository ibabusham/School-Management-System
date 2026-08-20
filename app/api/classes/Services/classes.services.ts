import { randomUUID } from "crypto";
import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/app/utils/errors.utility";
import type { CreateClassInput, UpdateClassInput, GetClassListQueryInput } from "../schemas";

async function findClassById(id: string) {
  const classRecord = await prisma.classes.findUnique({
    where: { id },
  });

  if (!classRecord) {
    throw new AppError("Class not found", 404);
  }

  return classRecord;
}

const studentInclude = {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      account_status: true,
      createdAt: true,
    },
  },
} as const;

export async function assignStudentsToClass(classId: string, studentIds: string[]) {
  await findClassById(classId);

  const uniqueStudentIds = [...new Set(studentIds)];
  const students = await prisma.student.findMany({
    where: {
      id: { in: uniqueStudentIds },
      account_status: true,
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
      account_status: true,
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
  return prisma.classes.create({
    data: {
      id: randomUUID(),
      class_name: data.class_name,
      academicYears: {
        create: {
          year: {
            connect: {
              id: data.academic_year_id,
            },
          },
        },
      },
      students: {
        connect: { id: data.student_id },
      },
      subjects: {
        connect: { id: data.subject_id },
      },
      teachers: {
        connect: { id: data.teacher_id },
      },
      terms: {
        connect: { id: data.term_id },
      },
    },
  });
}
export async function updateClass(data: UpdateClassInput) {
  return prisma.classes.update({
    where: {id: data.class_id},
    data: {
      class_name: data.class_name,
      academic_year_id: data.academic_year_id,
      term_id: data.term_id,
      teacher_id: data.teacher_id,
      student_id: data.student_id,
      subject_id: data.subject_id,
      students: {
        connect: { id: data.student_id },
      },
      subjects: {
        connect: { id: data.subject_id },
      },
      teachers: {
        connect: { id: data.teacher_id },
      },
      terms: {
        connect: { id: data.term_id },
      },
    },
  });
}
export async function deleteClass(id: string) {
  return prisma.classes.delete({
    where: { id },
  });
}
export async function getClassById(id: string) {
  return prisma.classes.findUnique({
    where: { id },
  });
}
export async function getClassList(data: GetClassListQueryInput) {
  return prisma.classes.findMany({
    skip: (data.page - 1) * data.limit,
    take: data.limit,
    include: {
      academicYears: true,
      students: true,
      subjects: true,
      teachers: true,
      terms: true,
    },
  });
}