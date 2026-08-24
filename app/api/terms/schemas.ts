import { z } from "zod";

function validDate(message: string) {
  return z.coerce
    .date({ error: message })
    .refine((date) => !Number.isNaN(date.getTime()), { error: message });
}

export const createTermSchema = z
  .object({
    termName: z.string().trim().min(1, "Name is required"),
    startDate: validDate("Valid start date is required"),
    endDate: validDate("Valid end date is required"),
    yearId: z.string().uuid("Academic year id must be a valid UUID"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    error: "End date must be on or after start date",
    path: ["endDate"],
  });

export const updateTermSchema = z
  .object({
    termName: z.string().trim().min(1, "Name is required").optional(),
    startDate: validDate("Valid start date is required").optional(),
    endDate: validDate("Valid end date is required").optional(),
    yearId: z.string().uuid("Academic year id must be a valid UUID").optional(),
  })
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

export const termListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
});

export type CreateTermInput = z.infer<typeof createTermSchema>;
export type UpdateTermInput = z.infer<typeof updateTermSchema>;
export type TermListQuery = z.infer<typeof termListQuerySchema>;
