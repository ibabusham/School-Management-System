import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/app/utils/errors.utility";
import type {
  AssignSubjectToClassInput,
  AssignSubjectToTeacherInput,
  CreateSubjectInput,
  SubjectListQuery,
  UpdateSubjectInput,
} from "../schemas";
import { pickDefined } from "@/app/utils/pick-defined";
import { findTeacherById } from "@/app/api/teachers/services/teacher.service";
import { findClassById } from "@/app/api/classes/Services/classes.services";
const subjectInclude = {
  class: true,
  teacher: {
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
  },
} as const;
export async function findSubjectById(id: string) {
  const subject = await prisma.subjects.findUnique({
    where: { id },
    include: subjectInclude,
  });

  if (!subject) {
    throw new AppError("Subject not found", 404);
  }

  return subject;
}

export async function createSubject(data: CreateSubjectInput) {
  await findClassById(data.classId);
  await findTeacherById(data.teacherId);

  return prisma.subjects.create({
    data: {
      subjectName: data.subjectName,
      subjectCode: data.subjectCode,
      description: data.description,
      classId: data.classId,
      teacherId: data.teacherId,
    },
    include: subjectInclude,
  });
}
export async function updateSubject(subjectId: string, data: UpdateSubjectInput) {
  await findSubjectById(subjectId);

  if (data.classId) {
    await findClassById(data.classId);
  }
  if (data.teacherId) {
    await findTeacherById(data.teacherId);
  }

    return prisma.subjects.update({
    where: { id: subjectId },
    data: pickDefined(data),
    include: subjectInclude,
});
}
export async function deleteSubject(id: string) {
  await findSubjectById(id);

  return prisma.subjects.delete({
    where: { id },
  });
}
export async function getSubjectById(id: string) {
  return findSubjectById(id);
}
export async function getSubjectList(data: SubjectListQuery) {
  const { page, limit, search } = data;
  const skip = (page - 1) * limit;
  const where = {
    ...(search && {
      OR: [
        { subjectName: { contains: search, mode: "insensitive" as const } },
        { subjectCode: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [subjects, total] = await Promise.all([
    prisma.subjects.findMany({
      where,
      skip,
      take: limit,
      include: subjectInclude,
      orderBy: { subjectName: "asc" },
    }),
    prisma.subjects.count({ where }),
  ]);

  return {
    data: subjects,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
export async function assignSubjectToClass(subjectId: string, data: AssignSubjectToClassInput) {
  await findSubjectById(subjectId);
  await findClassById(data.classId);

  return prisma.subjects.update({
    where: { id: subjectId },
    data: { classId: data.classId },
    include: subjectInclude,
  });
}
export async function assignSubjectToTeacher(subjectId: string, data: AssignSubjectToTeacherInput) {
  await findSubjectById(subjectId);
  await findTeacherById(data.teacherId);

  return prisma.subjects.update({
    where: { id: subjectId },
    data: { teacherId: data.teacherId },
    include: subjectInclude,
  });
}
