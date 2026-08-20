import { z } from "zod";

function validDate(message: string) {
  return z.coerce
    .date({ error: message })
    .refine((date) => !Number.isNaN(date.getTime()), { error: message });
}

export const academicYearSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Academic year name is required"),
  startDate: validDate("Valid start date is required"),
  endDate: validDate("Valid end date is required"),
});

export const createAcademicYearSchema = academicYearSchema
  .omit({ id: true })
  .refine((data) => data.endDate >= data.startDate, {
    error: "End date must be on or after start date",
    path: ["endDate"],
  });

export const updateAcademicYearSchema = academicYearSchema.partial();

export const deleteAcademicYearSchema = z.object({
  id: z.string().uuid(),
});

export const getAcademicYearSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
});

export type AcademicYear = z.infer<typeof academicYearSchema>;
export type CreateAcademicYear = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYear = z.infer<typeof updateAcademicYearSchema>;
export type DeleteAcademicYear = z.infer<typeof deleteAcademicYearSchema>;
export type GetAcademicYear = z.infer<typeof getAcademicYearSchema>;
