import { z } from "zod";

function validDate(message: string) {
  return z.coerce
    .date({ error: message })
    .refine((date) => !Number.isNaN(date.getTime()), { error: message });
}

function futureDueDate(message: string) {
  return validDate(message).refine((date) => date.getTime() > Date.now(), {
    message: "Due date must be in the future",
  });
}

export const assignmentIdParamSchema = z
  .string()
  .uuid("Assignment id must be a valid UUID");

export const assignmentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  subjectId: z.string().uuid().optional(),
});
const attachmentSchema = z.string().trim().min(
  1,
   "Attachment is required").url("Attachment must be a valid URL");

export const createAssignmentSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  dueDate: futureDueDate("Valid due date is required"),
  maximumGrade: z.coerce.number().int().min(1, "Maximum grade must be at least 1"),
  submissionInstructions: z.string().trim().min(1, "Submission instructions are required"),
  subjectId: z.string().uuid("Subject id must be a valid UUID"),
  attachments: attachmentSchema
});

export const updateAssignmentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").optional(),
  description: z.string().trim().min(1, "Description is required").optional(),
  dueDate: futureDueDate("Valid due date is required").optional(),
  maximumGrade: z.coerce.number().int().min(1, "Maximum grade must be at least 1").optional(),
  submissionInstructions: z.string().trim().min(1).optional(),
  subjectId: z.string().uuid("Subject id must be a valid UUID").optional(),
  attachments: attachmentSchema.optional(),
});

export const markAssignmentSchema = z.object({
  studentId: z.string().uuid("Student id must be a valid UUID"),
  score: z.coerce.number().int().min(0, "Score must be at least 0"),
});

export const bulkMarkAssignmentSchema = z
  .object({
    marks: z.array(markAssignmentSchema).min(1, "At least one mark is required"),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();

    for (const mark of data.marks) {
      if (seen.has(mark.studentId)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate student id in marks: ${mark.studentId}`,
          path: ["marks"],
        });
        return;
      }
      seen.add(mark.studentId);
    }
  });

export const submissionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});


export function parseAssignmentRouteId(id: string) {
  return assignmentIdParamSchema.parse(id);
}

export type AssignmentListQuery = z.infer<typeof assignmentListQuerySchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type BulkMarkAssignmentInput = z.infer<typeof bulkMarkAssignmentSchema>;
export type SubmissionListQuery = z.infer<typeof submissionListQuerySchema>;
