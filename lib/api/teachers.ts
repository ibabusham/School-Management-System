import { apiRequest } from "@/lib/api/client";
import type { Pagination } from "@/lib/auth/types";

export type TeacherSummary = {
  id: string;
  employId: number;
  name: string;
  specilization: string;
};

export type TeacherDetail = TeacherSummary & {
  email: string;
  phoneNumber: string;
  accountStatus: boolean;
};

export type CreateTeacherInput = {
  username: string;
  employId: number;
  name: string;
  password: string;
  email: string;
  phoneNumber: string;
  specilization: string;
};

export type UpdateTeacherInput = {
  name?: string;
  email?: string;
  phoneNumber?: string;
  specilization?: string;
};

export type TeacherListResponse = {
  data: TeacherSummary[];
  pagination: Pagination;
};

function buildPaginationQuery(page: number, limit: number) {
  return new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
}

export async function fetchTeachers(page = 1, limit = 10) {
  return apiRequest<TeacherListResponse>(
    `/api/teachers?${buildPaginationQuery(page, limit).toString()}`
  );
}

export async function fetchTeacher(id: string) {
  const result = await apiRequest<{ teacher: TeacherDetail }>(
    `/api/teachers/${id}`
  );
  return result.teacher;
}

export async function createTeacher(input: CreateTeacherInput) {
  return apiRequest<{ message: string; teacher: TeacherSummary }>(
    "/api/teachers",
    { method: "POST", body: input }
  );
}

export async function updateTeacher(id: string, input: UpdateTeacherInput) {
  const result = await apiRequest<{ teacher: TeacherDetail }>(
    `/api/teachers/${id}`,
    { method: "PATCH", body: input }
  );
  return result.teacher;
}

export async function deleteTeacher(id: string) {
  return apiRequest<{ message: string }>(`/api/teachers/${id}`, {
    method: "DELETE",
  });
}
