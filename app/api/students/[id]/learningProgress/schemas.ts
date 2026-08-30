import { z } from "zod";

function validDate(message: string) {
  return z.coerce
    .date({ error: message })
    .refine((date) => !Number.isNaN(date.getTime()), { error: message });
}

export const learningProgressNotesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const createProgressNoteSchema = z.object({
  noteDate: validDate("Valid note date is required").optional(),
  noteObservation: z.string().trim().min(1, "Note observation is required"),
  strengths: z.string().trim().min(1, "Strengths is required"),
  areasForImprovement: z.string().trim().min(1, "Areas for improvement is required"),
  teacherId: z.string().uuid("Teacher id must be a valid UUID").optional(),
});

export const updateProgressNoteSchema = z.object({
  noteDate: validDate("Valid note date is required").optional(),
  noteObservation: z.string().trim().min(1, "Note observation is required").optional(),
  strengths: z.string().trim().min(1, "Strengths is required").optional(),
  areasForImprovement: z.string().trim().min(1, "Areas for improvement is required").optional(),
});

export type LearningProgressNotesQuery = z.infer<typeof learningProgressNotesQuerySchema>;
export type CreateProgressNoteInput = z.infer<typeof createProgressNoteSchema>;
export type UpdateProgressNoteInput = z.infer<typeof updateProgressNoteSchema>;
