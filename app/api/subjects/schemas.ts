import { z } from "zod";

export const createSubjectSchema = z.object({
  subject_id: z.string().min(1, "Subject id is required"),
  subject_name: z.string().min(1, "Subject name is required"),
  subject_code: z.string().min(1, "Subject code is required"),
  subject_description: z.string().min(1, "Subject description is required"),
  class_id: z.string().min(1, "Class id is required"),
  teacher_id: z.string().min(1, "Teacher id is required"),
});
export const updateSubjectSchema = z.object({
  subject_id: z.string().min(1, "Subject id is required"),
  subject_name: z.string().min(1, "Subject name is required"),
  subject_code: z.string().min(1, "Subject code is required"),
  subject_description: z.string().min(1, "Subject description is required"),
  class_id: z.string().min(1, "Class id is required"),
  teacher_id: z.string().min(1, "Teacher id is required"),
});
export const deleteSubjectSchema = z.object({
  subject_id: z.string().min(1, "Subject id is required"),
});
export const getSubjectByIdSchema = z.object({
  subject_id: z.string().min(1, "Subject id is required"),
});
export const getSubjectListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
export const assignSubjectToClassSchema = z.object({
  subject_id: z.string().min(1, "Subject id is required"),
  class_id: z.string().min(1, "Class id is required"),
});
export const assignSubjectToTeacherSchema = z.object({
  subject_id: z.string().min(1, "Subject id is required"),
  teacher_id: z.string().min(1, "Teacher id is required"),
});
export const unassignSubjectFromClassSchema = z.object({
  subject_id: z.string().min(1, "Subject id is required"),
  class_id: z.string().min(1, "Class id is required"),
});
export const unassignSubjectFromTeacherSchema = z.object({
  subject_id: z.string().min(1, "Subject id is required"),
  teacher_id: z.string().min(1, "Teacher id is required"),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type DeleteSubjectInput = z.infer<typeof deleteSubjectSchema>;
export type GetSubjectByIdInput = z.infer<typeof getSubjectByIdSchema>;
export type GetSubjectListQueryInput = z.infer<typeof getSubjectListQuerySchema>;
export type AssignSubjectToClassInput = z.infer<typeof assignSubjectToClassSchema>;
export type AssignSubjectToTeacherInput = z.infer<typeof assignSubjectToTeacherSchema>;
export type UnassignSubjectFromClassInput = z.infer<typeof unassignSubjectFromClassSchema>;
export type UnassignSubjectFromTeacherInput = z.infer<typeof unassignSubjectFromTeacherSchema>;