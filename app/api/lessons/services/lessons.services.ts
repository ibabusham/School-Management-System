import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/app/utils/errors.utility";
import { CreateLessonInput, LessonListQuery, UpdateLessonInput } from "../schemas";
import { randomUUID } from "crypto";


const lessonInclude = {
    subject: {
        include: {
            class: true,
            teacher: true,
        },
    },
} as const;

async function findSubjectById(id: string) {
    const subject = await prisma.subjects.findUnique({
        where: { id },
        include: { class: true },
    });
    if (!subject) {
        throw new AppError("Subject not found", 404);
    }
    return subject;
}

async function findLessonById(id: string) {
    const lesson = await prisma.lessons.findUnique({
        where: { id },
        include: lessonInclude,
    });
    if (!lesson) {
        throw new AppError("Lesson not found", 404);
    }
    return lesson;
}

function mapCreateData(input: CreateLessonInput) {
    return {
        id: randomUUID() as string,
        lessonTitle: input.lessonTitle,
        lessonDescription: input.lessonDescription,
        subjectId: input.subjectId,
        lessonDate: input.lessonDate,
        learningObjectinve: input.learningObjectinve,
        learningMaterial: input.learningMaterial,
        completionStatus: input.completionStatus,
    };
}

function mapUpdateData(input: UpdateLessonInput) {
    const { lessonTitle, 
        lessonDescription,
         subjectId, lessonDate, 
         learningObjectinve, 
         learningMaterial, 
         completionStatus } = input;
    return {
        ...(lessonTitle !== undefined && { lessonTitle: lessonTitle }),
        ...(lessonDescription !== undefined && { lessonDescription: lessonDescription }),
        ...(subjectId !== undefined && { subjectId: subjectId }),
        ...(lessonDate !== undefined && { lessonDate: lessonDate }),
        ...(learningObjectinve !== undefined && { learningObjectinve: learningObjectinve }),
        ...(learningMaterial !== undefined && { learningMaterial: learningMaterial }),
        ...(completionStatus !== undefined && { completionStatus: completionStatus }),
    };
}

export async function createLesson(input: CreateLessonInput) {
    await findSubjectById(input.subjectId);
    return prisma.lessons.create({
        data: mapCreateData(input),
        include: lessonInclude,
    });
}

export async function getLesson(id: string) {
    return findLessonById(id);
}

export async function getLessonList(query: LessonListQuery) {
  const { page, limit, subjectId } = query;
  const skip = (page - 1) * limit;
  const where = {
    ...(subjectId && { subjectId }),
  };
  const [lessons, total] = await Promise.all([
    prisma.lessons.findMany({ where,
         skip,
          take: limit,
           include: lessonInclude,
           orderBy: { lessonDate: "desc" },
         }),
    prisma.lessons.count({ where }),
  ]);
  return {
    data: lessons,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
export async function updateLesson(id: string, input: UpdateLessonInput) {
    await findLessonById(id);

    if (input.subjectId) {
        await findSubjectById(input.subjectId);
    }

    return prisma.lessons.update({
        where: { id },
        data: mapUpdateData(input),
        include: lessonInclude,
    });
}
export async function deleteLesson(id: string) {
    await findLessonById(id);
    return prisma.lessons.delete({
        where: { id },      
        include: lessonInclude,
    });
}