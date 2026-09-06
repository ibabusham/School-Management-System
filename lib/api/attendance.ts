import { apiRequest } from "@/lib/api/client";
import type { Pagination } from "@/lib/auth/types";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export type Attendance = {
  id: string;
  attendanceDate: string;
  attendanceStatus: AttendanceStatus;
  attendancePercentage: number;
  studentId: string;
  subjectId: string;
};

export type CreateAttendanceInput = {
  studentId: string;
  subjectId: string;
  attendanceDate: string;
  attendanceStatus: AttendanceStatus;
};

export type UpdateAttendanceInput = Partial<CreateAttendanceInput>;

export type AttendanceListResponse = {
  data: Attendance[];
  pagination: Pagination;
};

export type AttendanceFilters = {
  studentId?: string;
  subjectId?: string;
  fromDate?: string;
  toDate?: string;
};

export async function fetchAttendance(
  page = 1,
  limit = 10,
  filters?: AttendanceFilters
) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.studentId) params.set("studentId", filters.studentId);
  if (filters?.subjectId) params.set("subjectId", filters.subjectId);
  if (filters?.fromDate) params.set("fromDate", filters.fromDate);
  if (filters?.toDate) params.set("toDate", filters.toDate);
  return apiRequest<AttendanceListResponse>(`/api/attendance?${params.toString()}`);
}

export async function createAttendance(input: CreateAttendanceInput) {
  return apiRequest<{ message: string; attendance: Attendance }>(
    "/api/attendance",
    { method: "POST", body: input }
  );
}

export async function updateAttendance(id: string, input: UpdateAttendanceInput) {
  const result = await apiRequest<{ message: string; attendance: Attendance }>(
    `/api/attendance/${id}`,
    { method: "PATCH", body: input }
  );
  return result.attendance;
}

export async function deleteAttendance(id: string) {
  return apiRequest<{ message: string }>(`/api/attendance/${id}`, {
    method: "DELETE",
  });
}
