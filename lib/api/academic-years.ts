import { apiRequest } from "@/lib/api/client";
import type { Pagination } from "@/lib/auth/types";

export type AcademicYear = {
  id: string;
  yearName: string;
  startDate: string;
  endDate: string;
  status: string;
};

export type AcademicYearListResponse = {
  data: AcademicYear[];
  pagination: Pagination;
};

export async function fetchAcademicYears(page = 1, limit = 50) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiRequest<AcademicYearListResponse>(
    `/api/academicYears?${params.toString()}`
  );
}
