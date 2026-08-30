import { z } from "zod";

export const attendanceStatusSchema = z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]);

function validDate(message: string) {
  return z.coerce
    .date({ error: message })
    .refine((date) => !Number.isNaN(date.getTime()), { error: message });
}

export const createAttendanceSchema = z.object({
  studentId: z.string().uuid("Student id must be a valid UUID"),
  subjectId: z.string().uuid("Subject id must be a valid UUID"),
  attendanceDate: validDate("Valid attendance date is required"),
  attendanceStatus: attendanceStatusSchema,
});

export const updateAttendanceSchema = z.object({
  studentId: z.string().uuid("Student id must be a valid UUID").optional(),
  subjectId: z.string().uuid("Subject id must be a valid UUID").optional(),
  attendanceDate: validDate("Valid attendance date is required").optional(),
  attendanceStatus: attendanceStatusSchema.optional(),
});

export const attendanceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  studentId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  fromDate: validDate("Valid from date is required").optional(),
  toDate: validDate("Valid to date is required").optional(),
});

export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type AttendanceListQuery = z.infer<typeof attendanceListQuerySchema>;
