import type { Lessons } from "@/prisma/generated/client";

export {
  LESSON_CREATED_MESSAGE,
  LESSON_UPDATED_MESSAGE,
  LESSON_DELETED_MESSAGE,
} from "@/app/api/shared/operation-messages";

export function toLessonSummary(
  lesson: Pick<
    Lessons,
    "id" | "lessonTitle" | "lessonDescription" | "lessonDate" | "subjectId"
  >
) {
  return {
    id: lesson.id,
    lessonTitle: lesson.lessonTitle,
    lessonDescription: lesson.lessonDescription,
    lessonDate: lesson.lessonDate,
    subjectId: lesson.subjectId,
  };
}

export function toLesson(lesson: Lessons) {
  return {
    id: lesson.id,
    lessonTitle: lesson.lessonTitle,
    lessonDescription: lesson.lessonDescription,
    lessonDate: lesson.lessonDate,
    learningObjectinve: lesson.learningObjectinve,
    learningMaterial: lesson.learningMaterial,
    completionStatus: lesson.completionStatus,
    subjectId: lesson.subjectId,
  };
}
