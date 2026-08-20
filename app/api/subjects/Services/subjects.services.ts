import { randomUUID } from "crypto";
import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/app/utils/errors.utility";
import type {
  AssignSubjectToClassInput,
  AssignSubjectToTeacherInput,
  CreateSubjectInput,
  SubjectListQuery,
  UpdateSubjectInput,
} from "../schemas";

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
          account_status: true,
          createdAt: true,
        },
      },
    },
  },
} as const;

async function findSubjectById(id: string) {
  const subject = await prisma.subjects.findUnique({
    where: { id },
    include: subjectInclude,
  });

  if (!subject) {
    throw new AppError("Subject not found", 404);
  }

  return subject;
}

async function findClassById(id: string) {
  const classRecord = await prisma.classes.findUnique({ where: { id } });

  if (!classRecord) {
    throw new AppError("Class not found", 404);
  }

  return classRecord;
}

async function findTeacherById(id: string) {
  const teacher = await prisma.teacher.findFirst({
    where: { id, account_status: true },
  });

  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  return teacher;
}

function mapUpdateData(data: UpdateSubjectInput) {
  const { subject_name, subject_code, subject_description, class_id, teacher_id } = data;

  return {
    ...(subject_name !== undefined && { subject_name }),
    ...(subject_code !== undefined && { subject_code }),
    ...(subject_description !== undefined && { Description: subject_description }),
    ...(class_id !== undefined && { classId: class_id }),
    ...(teacher_id !== undefined && { teacherId: teacher_id }),
  };
}

export async function createSubject(data: CreateSubjectInput) {
  await findClassById(data.class_id);
  await findTeacherById(data.teacher_id);

  return prisma.subjects.create({
    data: {
      id: randomUUID(),
      subject_name: data.subject_name,
      subject_code: data.subject_code,
      Description: data.subject_description,
      classId: data.class_id,
      teacherId: data.teacher_id,
    },
    include: subjectInclude,
  });
}

export async function updateSubject(subjectId: string, data: UpdateSubjectInput) {
  await findSubjectById(subjectId);

  if (data.class_id) {
    await findClassById(data.class_id);
  }

  if (data.teacher_id) {
    await findTeacherById(data.teacher_id);
  }

  return prisma.subjects.update({
    where: { id: subjectId },
    data: mapUpdateData(data),
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
        { subject_name: { contains: search, mode: "insensitive" as const } },
        { subject_code: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [subjects, total] = await Promise.all([
    prisma.subjects.findMany({
      where,
      skip,
      take: limit,
      include: subjectInclude,
      orderBy: { subject_name: "asc" },
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
  await findClassById(data.class_id);

  return prisma.subjects.update({
    where: { id: subjectId },
    data: { classId: data.class_id },
    include: subjectInclude,
  });
}

export async function assignSubjectToTeacher(subjectId: string, data: AssignSubjectToTeacherInput) {
  await findSubjectById(subjectId);
  await findTeacherById(data.teacher_id);

  return prisma.subjects.update({
    where: { id: subjectId },
    data: { teacherId: data.teacher_id },
    include: subjectInclude,
  });
}
