import { z } from "zod";

function validDate(message: string) {
  return z.coerce
    .date({ error: message })
    .refine((date) => !Number.isNaN(date.getTime()), { error: message });
}

function futureLessonDate(message: string) {
  return validDate(message).refine((date) => date.getTime() > Date.now(), {
    message: "Lesson date must be in the future",
  });
}

export const lessonListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  subjectId: z.string().uuid().optional(),
});

export const lessonIdParamSchema = z.string().uuid("Lesson id must be a valid UUID");

export const createLessonSchema = z.object({
  lessonTitle: z.string().trim().min(1, "Lesson title is required"),
  lessonDescription: z.string().trim().min(1, "Lesson description is required"),
  subjectId: z.string().uuid("Subject id must be a valid UUID"),
  lessonDate: futureLessonDate("Valid lesson date is required"),
  learningObjectinve: z.string().trim().min(1, "Learning objective is required"),
  learningMaterial: z.string().trim().min(1, "Learning material is required"),
  completionStatus: z.enum(["COMPLEATED", "INCOMPLEATE"]),
});

export const updateLessonSchema = z.object({
  lessonTitle: z.string().trim().min(1, "Lesson title is required").optional(),
  lessonDescription: z.string().trim().min(1, "Lesson description is required").optional(),
  subjectId: z.string().uuid("Subject id must be a valid UUID").optional(),
  lessonDate: futureLessonDate("Valid lesson date is required").optional(),
  learningObjectinve: z.string().trim().min(1, "Learning objective is required").optional(),
  learningMaterial: z.string().trim().min(1, "Learning material is required").optional(),
  completionStatus: z.enum(["COMPLEATED", "INCOMPLEATE"]).optional(),
});

export function parseLessonRouteId(id: string) {
  return lessonIdParamSchema.parse(id);
}

export type LessonListQuery = z.infer<typeof lessonListQuerySchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
