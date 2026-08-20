import { z } from "zod";

export const createClassSchema = z.object({
  class_id: z.string().min(1, "Class id is required"),
  class_name: z.string().min(1, "Class name is required"),
  academic_year_id: z.string().min(1, "Academic year id is required"),
  term_id: z.string().min(1, "Term id is required"),
  teacher_id: z.string().min(1, "Teacher id is required"),
  student_id: z.string().min(1, "Student id is required"),
  subject_id: z.string().min(1, "Subject id is required"),
});

export const updateClassSchema = z.object({
  class_id: z.string().min(1, "Class id is required"),
  class_name: z.string().min(1, "Class name is required"),
  class_description: z.string().min(1, "Class description is required"),
  class_status: z.enum(["ACTIVE", "INACTIVE"]),
  academic_year_id: z.string().min(1, "Academic year id is required"),
  term_id: z.string().min(1, "Term id is required"),
  teacher_id: z.string().min(1, "Teacher id is required"),
  student_id: z.string().min(1, "Student id is required"),
  subject_id: z.string().min(1, "Subject id is required"),
});
export const deleteClassSchema = z.object({
  class_id: z.string().min(1, "Class id is required"),
});
export const getClassByIdSchema = z.object({
  class_id: z.string().min(1, "Class id is required"),
});
export const getClassListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const assignStudentsSchema = z.object({
  studentIds: z
    .array(z.string().trim().min(1, "Student id is required"))
    .min(1, "At least one student id is required"),
});
export const unassignStudentsSchema = z.object({
  studentId: z.string().trim().min(1, "Student id is required"),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type DeleteClassInput = z.infer<typeof deleteClassSchema>;
export type GetClassByIdInput = z.infer<typeof getClassByIdSchema>;
export type GetClassListQueryInput = z.infer<typeof getClassListQuerySchema>;
export type AssignStudentsInput = z.infer<typeof assignStudentsSchema>;
export type UnassignStudentsInput = z.infer<typeof unassignStudentsSchema>;