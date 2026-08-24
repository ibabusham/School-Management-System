import { z } from "zod"; // Zod validates request data before it reaches the database

// Gender must match the Prisma Gender enum in schema.prisma
const genderSchema = z.enum(["MALE", "FEMALE"]);

// Body required when creating a student
export const createStudentSchema = z.object({
  student_id: z.number().int().min(1, "Student id is required"),
  username: z.string().trim().min(1, "Username is required"),
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  password: z.string().min(1, "Password is required"),
  email: z.string().trim().email("Valid email is required"),
  phonenumber: z.string().trim().min(1, "Phone number is required").optional(),
  // coerce.date() turns an ISO string like "2010-05-20" into a Date object
  date_of_birth: z.coerce.date({ error: "Valid date of birth is required" }),
  enrollment_date: z.coerce.date({ error: "Valid enrollment date is required" }),
  gender: genderSchema,
});

// Body for updating a student — every field is optional (send only what changed)
export const updateStudentSchema = z.object({
  student_id: z.string().trim().min(1).optional(),
  first_name: z.string().trim().min(1).optional(),
  last_name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  phonenumber: z.string().trim().min(1).optional(),
  date_of_birth: z.coerce.date().optional(),
  enrollment_date: z.coerce.date().optional(),
  learning_progress_id: z.string().trim().min(1).optional(),
  gender: genderSchema.optional(),
});
export const deleteStudentSchema = z.object({
  id: z.string().trim().min(1, "Student id is required"),
});
export const getStudentByIdSchema = z.object({
  id: z.string().trim().min(1, "Student id is required"),
});
// Query params for the list endpoint: ?page=1&limit=10
export const studentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// TypeScript types inferred from the Zod schemas (so we don't duplicate types by hand)
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentListQuery = z.infer<typeof studentListQuerySchema>;
