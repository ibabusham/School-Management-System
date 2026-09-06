import { apiRequest } from "@/lib/api/client";
import type { Pagination } from "@/lib/auth/types";

export type ClassAcademicYearLink = {
  year: {
    id: string;
    yearName: string;
    startDate: string;
    endDate: string;
    status: string;
  };
};

export type ClassSummary = {
  id: string;
  className: string;
  academicYears: ClassAcademicYearLink[];
  students: AssignedStudent[];
  subjects: { id: string }[];
};
export type AssignedStudent = {
  id: string;
  studentId: number;
  firstName: string;
  lastName: string;
};

export type AssignStudentsResponse = {
  message: string;
  classId: string;
  className: string;
  students: AssignedStudent[];
  assignedCount: number;
};
export type ClassDetail = ClassSummary;

export type CreateClassInput =
  | {
      className: string;
      academicYearId: string;
    }
  | {
      className: string;
      yearName: string;
      startDate: string;
      endDate: string;
    };

export type UpdateClassInput = {
  className?: string;
  academicYearId?: string;
};

export type ClassListResponse = {
  data: ClassSummary[];
  pagination: Pagination;
};

function buildPaginationQuery(page: number, limit: number) {
  return new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
}

export async function fetchClasses(page = 1, limit = 10) {
  return apiRequest<ClassListResponse>(
    `/api/classes?${buildPaginationQuery(page, limit).toString()}`
  );
}

export async function fetchClass(id: string) {
  const result = await apiRequest<{ classData: ClassDetail }>(
    `/api/classes/${id}`
  );
  return result.classData;
}

export async function createClass(input: CreateClassInput) {
  return apiRequest<{ classData: ClassDetail }>("/api/classes", {
    method: "POST",
    body: input,
  });
}

export async function updateClass(id: string, input: UpdateClassInput) {
  const result = await apiRequest<{ classData: ClassDetail }>(
    `/api/classes/${id}`,
    { method: "PATCH", body: input }
  );
  return result.classData;
}

export async function deleteClass(id: string) {
  return apiRequest<{ message: string }>(`/api/classes/${id}`, {
    method: "DELETE",
  });
}
export async function assignStudentsToClass(
  classId: string,
  studentIds: string[]
) {
  return apiRequest<AssignStudentsResponse>(
    `/api/classes/${classId}/students`,
    {
      method: "POST",
      body: { studentIds },
    }
  );
}

export async function unassignStudentFromClass(
  classId: string,
  studentId: string
) {
  return apiRequest<{ message: string }>(
    `/api/classes/${classId}/students/${studentId}`,
    { method: "DELETE" }
  );
}