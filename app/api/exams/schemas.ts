import { z } from "zod";

function validDate(message: string) {
  return z.coerce
    .date({ error: message })
    .refine((date) => !Number.isNaN(date.getTime()), { error: message });
}

export const createExamSchema = z.object({
  examName: z.string().trim().min(1, "Exam name is required"),
  examDate: validDate("Valid exam date is required"),
  subjectId: z.string().uuid("Subject id must be a valid UUID"),
  maximumGrade: z.coerce.number().int().min(1, "Maximum grade must be at least 1"),
});

export const updateExamSchema = z.object({
  examName: z.string().trim().min(1, "Exam name is required").optional(),
  examDate: validDate("Valid exam date is required").optional(),
  subjectId: z.string().uuid("Subject id must be a valid UUID").optional(),
  maximumGrade: z.coerce.number().int().min(1, "Maximum grade must be at least 1").optional(),
});

export const examListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  subjectId: z.string().uuid().optional(),
});

export const markExamSchema = z.object({
  studentId: z.string().uuid("Student id must be a valid UUID"),
  score: z.coerce.number().int().min(0, "Score must be at least 0"),
});

export const bulkMarkExamSchema = z.object({
  marks: z.array(markExamSchema).min(1, "At least one mark is required"),
});

export const submissionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type ExamListQuery = z.infer<typeof examListQuerySchema>;
export type MarkExamInput = z.infer<typeof markExamSchema>;
export type BulkMarkExamInput = z.infer<typeof bulkMarkExamSchema>;
export type SubmissionListQuery = z.infer<typeof submissionListQuerySchema>;
