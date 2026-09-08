import { apiRequest } from "@/lib/api/client";
import type { Pagination } from "@/lib/auth/types";

export type SubjectSummary = {
  id: string;
  subjectName: string;
  subjectCode: string;
  teacherId?: string;
  classId?: string;
  className?: string;
};

export type SubjectDetail = SubjectSummary & {
  description: string;
  classId: string;
  teacherId: string;
  class?:{
    className: string;
  };
  teacher?:{
    name: string;
  };
};

export type CreateSubjectInput = {
  subjectName: string;
  subjectCode: string;
  description: string;
  classId: string;
  teacherId: string;
};

export type UpdateSubjectInput = {
  subjectName?: string;
  subjectCode?: string;
  description?: string;
  classId?: string;
  teacherId?: string;
};

export type SubjectListResponse = {
  data: SubjectSummary[];
  pagination: Pagination;
};

export async function fetchSubjects(page = 1, limit = 10, search?: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) {
    params.set("search", search);
  }

  return apiRequest<SubjectListResponse>(`/api/subjects?${params.toString()}`);
}
export async function fetchSubject(id: string) {
 const result = await apiRequest<{ subject: SubjectDetail }>(`/api/subjects/${id}`);
 
 return result.subject;
}
export async function createSubject(input: CreateSubjectInput) {
  return apiRequest<{ message: string; subject: SubjectSummary }>("/api/subjects", {
    method: "POST",
    body: input,
  });
}
export async function updateSubject(id: string, input: UpdateSubjectInput) {
  const result = await apiRequest<{ subject: SubjectDetail }>(`/api/subjects/${id}`, {
    method: "PATCH",
    body: input,
  });
  return result.subject;
}
export async function deleteSubject(id: string) {
  const result = await apiRequest<{ subject: SubjectSummary }>(`/api/subjects/${id}`, {
    method: "DELETE",
  });
  return result.subject;
}