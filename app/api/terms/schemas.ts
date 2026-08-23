import { z } from "zod";

export const createTermSchema = z.object({
  name: z.string().min(1, "Name is required"),
 startDate: z.date().optional(),
 endDate: z.date().optional(),
 status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
 yearId: z.string().uuid("Year ID is required"),

});

export const updateTermSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),    
  yearId: z.string().uuid("Year ID is required"),
});

export const termListQuerySchema = z.object({   
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
});

export type CreateTermInput = z.infer<typeof createTermSchema>;
export type UpdateTermInput = z.infer<typeof updateTermSchema>;
export type TermListQuery = z.infer<typeof termListQuerySchema>;
