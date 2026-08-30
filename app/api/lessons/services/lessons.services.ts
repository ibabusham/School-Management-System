import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/app/utils/errors.utility";
import { CreateLessonInput, LessonListQuery, UpdateLessonInput } from "../schemas";
import { randomUUID } from "crypto";
import { findSubjectById } from "@/app/api/subjects/Services/subjects.services";
import { pickDefined } from "@/app/utils/pick-defined";
import type { JwtPayload } from "@/app/api/auth/services/jwt";
import {
  buildSubjectIdScopeWhere,
  getScopedSubjectIds,
  requireTeacherOwnsLesson,
  requireTeacherOwnsSubject,
} from "@/app/api/auth/services/teacher-scope";

const lessonInclude = {
    subject: {
        include: {
            class: true,
            teacher: true,
        },
    },
} as const;
export async function findLessonById(id: string) {
    const lesson = await prisma.lessons.findUnique({
        where: { id },
        include: lessonInclude,
    });
    if (!lesson) {
        throw new AppError("Lesson not found", 404);
    }
    return lesson;
}
export async function createLesson(input: CreateLessonInput, auth: JwtPayload) {
    await requireTeacherOwnsSubject(auth, input.subjectId);
    await findSubjectById(input.subjectId);
    return prisma.lessons.create({
        data: {
            id: randomUUID() as string,
            lessonTitle: input.lessonTitle,
            lessonDescription: input.lessonDescription,
            subjectId: input.subjectId,
            lessonDate: input.lessonDate,
            learningObjectinve: input.learningObjectinve,
            learningMaterial: input.learningMaterial,
            completionStatus: input.completionStatus,
        },
        include: lessonInclude,
    });
}
export async function getLesson(id: string, auth: JwtPayload) {
    await requireTeacherOwnsLesson(auth, id);
    return findLessonById(id);
}
export async function getLessonList(query: LessonListQuery, auth: JwtPayload) {
  const scopedSubjectIds = await getScopedSubjectIds(auth);
  const { page, limit, subjectId } = query;
  const skip = (page - 1) * limit;
  const where = buildSubjectIdScopeWhere(scopedSubjectIds, subjectId);
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
export async function updateLesson(id: string, input: UpdateLessonInput, auth: JwtPayload) {
    await requireTeacherOwnsLesson(auth, id);
    await findLessonById(id);

    if (input.subjectId) {
        await requireTeacherOwnsSubject(auth, input.subjectId);
        await findSubjectById(input.subjectId);
    }

    return prisma.lessons.update({
        where: { id },
        data: pickDefined(input),
        include: lessonInclude,
    });
}
export async function deleteLesson(id: string, auth: JwtPayload) {
    await requireTeacherOwnsLesson(auth, id);
    await findLessonById(id);
    return prisma.lessons.delete({
        where: { id },      
        include: lessonInclude,
    });
}