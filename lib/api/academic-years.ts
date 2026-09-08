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

export type CreateAcademicYearInput = {
  yearName: string;
  startDate: string;
  endDate: string;
};

export type UpdateAcademicYearInput = Partial<CreateAcademicYearInput> & {
  status?: "ACTIVE" | "INACTIVE";
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

export async function fetchAcademicYear(id: string) {
  const result = await apiRequest<{ data: AcademicYear }>(
    `/api/academicYears/${id}`
  );
  return result.data;
}

export async function createAcademicYear(input: CreateAcademicYearInput) {
  return apiRequest<{ message: string; data: AcademicYear }>(
    "/api/academicYears",
    {
      method: "POST",
      body: input,
    }
  );
}

export async function updateAcademicYear(
  id: string,
  input: UpdateAcademicYearInput
) {
  const result = await apiRequest<{ message: string; data: AcademicYear }>(
    `/api/academicYears/${id}`,
    {
      method: "PATCH",
      body: input,
    }
  );
  return result.data;
}

export async function deleteAcademicYear(id: string) {
  return apiRequest<{ message: string }>(`/api/academicYears/${id}`, {
    method: "DELETE",
  });
}
