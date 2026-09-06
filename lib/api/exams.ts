import { apiRequest } from "@/lib/api/client";
import type { Pagination } from "@/lib/auth/types";

export type ExamSummary = {
  id: string;
  examName: string;
  examDate: string;
};

export type ExamDetail = {
  id: string;
  examName: string;
  examDate: string;
  maximumGrade: number;
  subjectId: string;
  subject?: {
    subjectName: string;
    subjectCode: string;
  };
};

export type ExamTakenSubmission = {
  id: string;
  studentId: string;
  examId: string;
  score: number;
  takenAt: string;
  firstName: string;
  lastName: string;
};

export type ExamMarkInput = {
  studentId: string;
  score: number;
};

export type StudentMarkCandidate = {
  id: string;
  studentId: number;
  firstName: string;
  lastName: string;
};

export type CreateExamInput = {
  examName: string;
  examDate: string;
  subjectId: string;
  maximumGrade: number;
};

export type UpdateExamInput = {
  examName?: string;
  examDate?: string;
  subjectId?: string;
  maximumGrade?: number;
};

export type ExamListResponse = {
  data: ExamSummary[];
  pagination: Pagination;
};

function buildQuery(page: number, limit: number, subjectId?: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (subjectId) {
    params.set("subjectId", subjectId);
  }

  return params;
}

function buildPageQuery(page: number, limit: number) {
  return new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
}

export async function fetchExams(page = 1, limit = 10, subjectId?: string) {
  return apiRequest<ExamListResponse>(
    `/api/exams?${buildQuery(page, limit, subjectId).toString()}`
  );
}

export async function fetchExam(id: string) {
  const result = await apiRequest<{ exam: ExamDetail }>(`/api/exams/${id}`);
  return result.exam;
}

export async function createExam(input: CreateExamInput) {
  return apiRequest<{ message: string; exam: ExamSummary }>("/api/exams", {
    method: "POST",
    body: input,
  });
}

export async function updateExam(id: string, input: UpdateExamInput) {
  const result = await apiRequest<{ message: string; exam: ExamDetail }>(
    `/api/exams/${id}`,
    { method: "PATCH", body: input }
  );
  return result.exam;
}

export async function deleteExam(id: string) {
  return apiRequest<{ message: string }>(`/api/exams/${id}`, {
    method: "DELETE",
  });
}

export async function fetchExamMissingMarks(
  examId: string,
  page = 1,
  limit = 100
) {
  return apiRequest<{
    data: StudentMarkCandidate[];
    pagination: Pagination;
  }>(`/api/exams/${examId}/marks/missing?${buildPageQuery(page, limit)}`);
}

export async function fetchExamTakenMarks(
  examId: string,
  page = 1,
  limit = 100
) {
  return apiRequest<{
    data: ExamTakenSubmission[];
    pagination: Pagination;
  }>(`/api/exams/${examId}/marks/taken?${buildPageQuery(page, limit)}`);
}

export async function submitExamMarks(examId: string, marks: ExamMarkInput[]) {
  return apiRequest<{ message: string }>(`/api/exams/${examId}/marks`, {
    method: "POST",
    body: { marks },
  });
}
