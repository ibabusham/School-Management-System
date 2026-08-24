import { z } from "zod";

function validDate(message: string) {
  return z.coerce
    .date({ error: message })
    .refine((date) => !Number.isNaN(date.getTime()), { error: message });
}

export const createClassSchema = z
  .object({
    className: z.string().trim().min(1, "Class name is required"),
    academicYearId: z.string().uuid("Academic year id must be a valid UUID").optional(),
    yearName: z.string().trim().min(1, "Academic year name is required").optional(),
    startDate: validDate("Valid start date is required").optional(),
    endDate: validDate("Valid end date is required").optional(),
  })
  .refine(
    (data) =>
      Boolean(data.academicYearId) ||
      Boolean(data.yearName && data.startDate && data.endDate),
    {
      error: "Provide academicYearId or yearName with startDate and endDate",
    }
  )
  .refine(
    (data) => {
      const hasId = Boolean(data.academicYearId);
      const hasInline = Boolean(data.yearName || data.startDate || data.endDate);
      return !(hasId && hasInline);
    },
    {
      error:
        "Use either academicYearId or inline academic year fields (yearName, startDate, endDate), not both",
    }
  )
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return data.endDate >= data.startDate;
    },
    {
      error: "End date must be on or after start date",
      path: ["endDate"],
    }
  );

export const updateClassSchema = z.object({
  className: z.string().trim().min(1, "Class name is required").optional(),
  academicYearId: z.string().uuid("Academic year id must be a valid UUID").optional(),
});

export const getClassListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const assignStudentsSchema = z.object({
  studentIds: z
    .array(z.uuid().trim().min(1, "Student id is required"))
    .min(1, "At least one student id is required"),
});

export const unassignStudentsSchema = z.object({
  studentId: z.string().trim().min(1, "Student id is required"),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type GetClassListQueryInput = z.infer<typeof getClassListQuerySchema>;
export type AssignStudentsInput = z.infer<typeof assignStudentsSchema>;
export type UnassignStudentsInput = z.infer<typeof unassignStudentsSchema>;
