import { z } from "zod";

export const createTeacherSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  employId: z.coerce.number().int().min(1, "Employee id is required").max(2147483647),
  name: z.string().trim().min(1, "Name is required"),
  password: z.string().min(1, "Password is required"),
  email: z.string().trim().email("Valid email is required"),
  phoneNumber: z.string().trim().min(1, "Phone number is required"),
  specilization: z.string().trim().min(1, "Specialization is required"),
});

export const updateTeacherSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  phoneNumber: z.string().trim().min(1).optional(),
  specilization: z.string().trim().min(1).optional(),
});

export const teacherListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const deleteTeacherSchema = z.object({
  id: z.string().trim().min(1, "Teacher id is required"),
});

export const getTeacherByIdSchema = z.object({
  id: z.string().trim().min(1, "Teacher id is required"),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type TeacherListQuery = z.infer<typeof teacherListQuerySchema>;
