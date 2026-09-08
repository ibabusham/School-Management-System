import { apiRequest } from "@/lib/api/client";
import type { Pagination } from "@/lib/auth/types";

export type Gender = "MALE" | "FEMALE";

export type StudentSummary = {
  id: string;
  studentId: number;
  firstName: string;
  lastName: string;
};

export type StudentDetail = StudentSummary & {
  email: string;
  phoneNumber: string | null;
  dateOfBirth: string;
  enrollmentDate: string;
  gender: Gender;
  classId: string | null;
  learningProgressId: string;
  accountStatus: boolean;
  class?: { id: string; className: string } | null;
  user?: { username: string };
};

export type CreateStudentInput = {
  studentId: number;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth: string;
  enrollmentDate: string;
  gender: Gender;
};

export type UpdateStudentInput = {
  studentId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  enrollmentDate?: string;
  gender?: Gender;
};

export type StudentListResponse = {
  data: StudentSummary[];
  pagination: Pagination;
};

function buildPaginationQuery(page: number, limit: number) {
  return new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
}

export async function fetchStudents(page = 1, limit = 10) {
  return apiRequest<StudentListResponse>(
    `/api/students?${buildPaginationQuery(page, limit).toString()}`
  );
}

export async function fetchStudent(id: string) {
  const result = await apiRequest<{ student: StudentDetail }>(
    `/api/students/${id}`
  );
  return result.student;
}

export async function createStudent(input: CreateStudentInput) {
  return apiRequest<{ message: string; student: StudentSummary }>(
    "/api/students",
    { method: "POST", body: input }
  );
}

export async function updateStudent(id: string, input: UpdateStudentInput) {
  const result = await apiRequest<{ student: StudentDetail }>(
    `/api/students/${id}`,
    { method: "PATCH", body: input }
  );
  return result.student;
}

export async function deleteStudent(id: string) {
  return apiRequest<{ message: string }>(`/api/students/${id}`, {
    method: "DELETE",
  });
}
