import { z } from "zod";

export const createSubjectSchema = z.object({
  subjectName: z.string().trim().min(1, "Subject name is required"),
  subjectCode: z.string().trim().min(1, "Subject code is required"),
  description: z.string().trim().min(1, "Subject description is required"),
  classId: z.string().uuid("Class id must be a valid UUID"),
  teacherId: z.string().uuid("Teacher id must be a valid UUID"),
});

export const updateSubjectSchema = z.object({
  subjectName: z.string().trim().min(1, "Subject name is required").optional(),
  subjectCode: z.string().trim().min(1, "Subject code is required").optional(),
  description: z.string().trim().min(1, "Subject description is required").optional(),
  classId: z.string().uuid("Class id must be a valid UUID").optional(),
  teacherId: z.string().uuid("Teacher id must be a valid UUID").optional(),
});

export const subjectListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
});

export const assignSubjectToClassSchema = z.object({
  classId: z.string().uuid("Class id must be a valid UUID"),
});

export const assignSubjectToTeacherSchema = z.object({
  teacherId: z.string().uuid("Teacher id must be a valid UUID"),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type SubjectListQuery = z.infer<typeof subjectListQuerySchema>;
export type AssignSubjectToClassInput = z.infer<typeof assignSubjectToClassSchema>;
export type AssignSubjectToTeacherInput = z.infer<typeof assignSubjectToTeacherSchema>;
