import { z } from "zod";

const genderSchema = z.enum(["MALE", "FEMALE"]);
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "Phone number must be exactly 10 digits");

export const createStudentSchema = z.object({
  studentId: z.number().int().min(1, "Student id is required").max(2147483647),
  username: z.string().trim().min(1, "Username is required"),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  password: z.string().min(1, "Password is required"),
  email: z.string().trim().email("Valid email is required"),
  phoneNumber: phoneSchema.optional(),
  dateOfBirth: z.coerce.date({ error: "Valid date of birth is required" }),
  enrollmentDate: z.coerce.date({ error: "Valid enrollment date is required" }),
  gender: genderSchema,
});

export const updateStudentSchema = z.object({
  studentId: z.coerce.number().int().min(1).max(2147483647).optional(),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  phoneNumber: phoneSchema.optional(),
  dateOfBirth: z.coerce.date().optional(),
  enrollmentDate: z.coerce.date().optional(),
  learningProgressId: z.string().trim().min(1).optional(),
  gender: genderSchema.optional(),
});

export const deleteStudentSchema = z.object({
  id: z.string().trim().min(1, "Student id is required"),
});

export const getStudentByIdSchema = z.object({
  id: z.string().trim().min(1, "Student id is required"),
});

export const studentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentListQuery = z.infer<typeof studentListQuerySchema>;
