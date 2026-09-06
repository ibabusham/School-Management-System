import { apiRequest } from "@/lib/api/client";
import type { Pagination } from "@/lib/auth/types";

export type LessonSummary = {
  id: string;
  lessonTitle: string;
  lessonDescription: string;
  lessonDate: string;
  subjectId: string;
};

export type LessonDetail = LessonSummary & {
  learningObjectinve: string;
  learningMaterial: string;
  completionStatus: "COMPLEATED" | "INCOMPLEATE";
};

export type CreateLessonInput = {
  lessonTitle: string;
  lessonDescription: string;
  subjectId: string;
  lessonDate: string;
  learningObjectinve: string;
  learningMaterial: string;
  completionStatus: "COMPLEATED" | "INCOMPLEATE";
};

export type UpdateLessonInput = Partial<CreateLessonInput>;

export type LessonListResponse = {
  data: LessonSummary[];
  pagination: Pagination;
};

export async function fetchLessons(page = 1, limit = 10, subjectId?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (subjectId) params.set("subjectId", subjectId);
  return apiRequest<LessonListResponse>(`/api/lessons?${params.toString()}`);
}

export async function fetchLesson(id: string) {
  const result = await apiRequest<{ lesson: LessonDetail }>(`/api/lessons/${id}`);
  return result.lesson;
}

export async function createLesson(input: CreateLessonInput) {
  return apiRequest<{ message: string; lesson: LessonSummary }>("/api/lessons", {
    method: "POST",
    body: input,
  });
}

export async function updateLesson(id: string, input: UpdateLessonInput) {
  const result = await apiRequest<{ message: string; lesson: LessonDetail }>(
    `/api/lessons/${id}`,
    { method: "PATCH", body: input }
  );
  return result.lesson;
}

export async function deleteLesson(id: string) {
  return apiRequest<{ message: string }>(`/api/lessons/${id}`, {
    method: "DELETE",
  });
}
