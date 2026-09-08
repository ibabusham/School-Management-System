import { apiRequest } from "@/lib/api/client";
import type { Pagination } from "@/lib/auth/types";
import type { AcademicYear } from "@/lib/api/academic-years";

export type Term = {
  id: string;
  termName: string;
  startDate: string;
  endDate: string;
  yearId: string;
  year: AcademicYear;
};

export type CreateTermInput = {
  termName: string;
  startDate: string;
  endDate: string;
  yearId: string;
};

export type UpdateTermInput = Partial<CreateTermInput>;

export type TermListResponse = {
  data: Term[];
  pagination: Pagination;
};

export async function fetchTerms(page = 1, limit = 10, search?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return apiRequest<TermListResponse>(`/api/terms?${params.toString()}`);
}

export async function fetchTerm(id: string) {
  const result = await apiRequest<{ term: Term }>(`/api/terms/${id}`);
  return result.term;
}

export async function createTerm(input: CreateTermInput) {
  return apiRequest<{ message: string; term: Term }>("/api/terms", {
    method: "POST",
    body: input,
  });
}

export async function updateTerm(id: string, input: UpdateTermInput) {
  const result = await apiRequest<{ message: string; term: Term }>(`/api/terms/${id}`, {
    method: "PATCH",
    body: input,
  });
  return result.term;
}

export async function deleteTerm(id: string) {
  return apiRequest<{ message: string }>(`/api/terms/${id}`, { method: "DELETE" });
}
