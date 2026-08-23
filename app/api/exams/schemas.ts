import { z } from "zod";

function validDate(message: string) {
  return z.coerce
    .date({ error: message })
    .refine((date) => !Number.isNaN(date.getTime()), { error: message });
}

export const createExamSchema = z.object({
  exam_name: z.string().trim().min(1, "Exam name is required"),
  exam_date: validDate("Valid exam date is required"),
  subject_id: z.string().uuid("Subject id must be a valid UUID"),
  maximum_grade: z.coerce.number().int().min(1, "Maximum grade must be at least 1"),
});

export const updateExamSchema = z.object({
  exam_name: z.string().trim().min(1, "Exam name is required").optional(),
  exam_date: validDate("Valid exam date is required").optional(),
  subject_id: z.string().uuid("Subject id must be a valid UUID").optional(),
  maximum_grade: z.coerce.number().int().min(1, "Maximum grade must be at least 1").optional(),
});

export const examListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  subject_id: z.string().uuid().optional(),
});

export const markExamSchema = z.object({
  student_id: z.string().uuid("Student id must be a valid UUID"),
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
