import { apiRequest } from "@/lib/api/client";
import type { Pagination } from "@/lib/auth/types";

export type StudentMarkCandidate = {
  id: string;
  studentId: number;
  firstName: string;
  lastName: string;
};

export type AssignmentSummary = {
  id: string;
  assignmentTitle: string;
  assignmentDescription: string;
  dueDate: string;
  maximumGrade: number;
  subjectId: string;
};

export type AssignmentDetail = {
  id: string;
  assignmentTitle: string;
  assignmentDescription: string;
  attachment: string;
  dueDate: string;
  maximumGrade: number;
  subjectId: string;
  submissionInstructions: string;
  subject?: {
    subjectName: string;
    subjectCode: string;
  };
};

export type AssignmentTakenSubmission = {
  id: string;
  assignmentId: string;
  studentId: string;
  score: number;
  takenAt: string;
  firstName: string;
  lastName: string;
};

export type AssignmentMarkInput = {
  studentId: string;
  score: number;
};

export type CreateAssignmentInput = {
  title: string;
  description: string;
  dueDate: string;
  maximumGrade: number;
  submissionInstructions: string;
  subjectId: string;
  attachments: string;
};

export type UpdateAssignmentInput = {
  title?: string;
  description?: string;
  dueDate?: string;
  maximumGrade?: number;
  submissionInstructions?: string;
  subjectId?: string;
  attachments?: string;
};

export type AssignmentListResponse = {
  data: AssignmentSummary[];
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

export async function fetchAssignments(
  page = 1,
  limit = 10,
  subjectId?: string
) {
  return apiRequest<AssignmentListResponse>(
    `/api/assignments?${buildQuery(page, limit, subjectId).toString()}`
  );
}

export async function fetchAssignment(id: string) {
  const result = await apiRequest<{ assignment: AssignmentDetail }>(
    `/api/assignments/${id}`
  );
  return result.assignment;
}

export async function createAssignment(input: CreateAssignmentInput) {
  return apiRequest<{ message: string; assignment: AssignmentSummary }>(
    "/api/assignments",
    { method: "POST", body: input }
  );
}

export async function updateAssignment(id: string, input: UpdateAssignmentInput) {
  const result = await apiRequest<{
    message: string;
    assignment: AssignmentDetail;
  }>(`/api/assignments/${id}`, { method: "PATCH", body: input });
  return result.assignment;
}

export async function deleteAssignment(id: string) {
  return apiRequest<{ message: string }>(`/api/assignments/${id}`, {
    method: "DELETE",
  });
}

export async function fetchAssignmentMissingMarks(
  assignmentId: string,
  page = 1,
  limit = 100
) {
  return apiRequest<{
    data: StudentMarkCandidate[];
    pagination: Pagination;
  }>(
    `/api/assignments/${assignmentId}/marks/missing?${buildPageQuery(page, limit)}`
  );
}

export async function fetchAssignmentTakenMarks(
  assignmentId: string,
  page = 1,
  limit = 100
) {
  return apiRequest<{
    data: AssignmentTakenSubmission[];
    pagination: Pagination;
  }>(
    `/api/assignments/${assignmentId}/marks/taken?${buildPageQuery(page, limit)}`
  );
}

export async function submitAssignmentMarks(
  assignmentId: string,
  marks: AssignmentMarkInput[]
) {
  return apiRequest<{ message: string }>(
    `/api/assignments/${assignmentId}/marks`,
    {
      method: "POST",
      body: { marks },
    }
  );
}
