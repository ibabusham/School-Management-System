import { z } from "zod";

export const createSubjectSchema = z.object({
  subject_name: z.string().trim().min(1, "Subject name is required"),
  subject_code: z.string().trim().min(1, "Subject code is required"),
  subject_description: z.string().trim().min(1, "Subject description is required"),
  class_id: z.string().uuid("Class id must be a valid UUID"),
  teacher_id: z.string().uuid("Teacher id must be a valid UUID"),
});

export const updateSubjectSchema = z.object({
  subject_name: z.string().trim().min(1, "Subject name is required").optional(),
  subject_code: z.string().trim().min(1, "Subject code is required").optional(),
  subject_description: z.string().trim().min(1, "Subject description is required").optional(),
  class_id: z.string().uuid("Class id must be a valid UUID").optional(),
  teacher_id: z.string().uuid("Teacher id must be a valid UUID").optional(),
});

export const subjectListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
});

export const assignSubjectToClassSchema = z.object({
  class_id: z.string().uuid("Class id must be a valid UUID"),
});

export const assignSubjectToTeacherSchema = z.object({
  teacher_id: z.string().uuid("Teacher id must be a valid UUID"),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type SubjectListQuery = z.infer<typeof subjectListQuerySchema>;
export type AssignSubjectToClassInput = z.infer<typeof assignSubjectToClassSchema>;
export type AssignSubjectToTeacherInput = z.infer<typeof assignSubjectToTeacherSchema>;
