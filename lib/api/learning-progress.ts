import { apiRequest } from "@/lib/api/client";
import type { Pagination } from "@/lib/auth/types";

export type LearningProgress = {
  subjectsAverages: number;
  overallAvreages: number;
  attendencePercentage: number;
  learningStatus: string;
};

export async function fetchLearningProgress(studentId: string) {
  const result = await apiRequest<{ learningProgress: LearningProgress }>(
    `/api/students/${studentId}/learningProgress?page=1&limit=1`
  );
  return result.learningProgress;
}

// --- Progress notes ---

export type ProgressNote = {
  id: string;
  noteDate: string;
  noteObservation: string;
  strengths: string;
  areasForImprovement: string;
  teacherId: string;
  learningProgressId: string;
  teacher?: {
    id: string;
    name: string;
    employId: number;
    specilization: string;
  };
};

export type CreateProgressNoteInput = {
  noteDate?: string;
  noteObservation: string;
  strengths: string;
  areasForImprovement: string;
};

export type UpdateProgressNoteInput = Partial<CreateProgressNoteInput>;

export type ProgressNoteListResponse = {
  data: ProgressNote[];
  pagination: Pagination;
};

export async function fetchProgressNotes(
  studentId: string,
  page = 1,
  limit = 10
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiRequest<ProgressNoteListResponse>(
    `/api/students/${studentId}/learningProgress/notes?${params.toString()}`
  );
}

export async function createProgressNote(
  studentId: string,
  input: CreateProgressNoteInput
) {
  return apiRequest<{ message: string; progressNote: ProgressNote }>(
    `/api/students/${studentId}/learningProgress/notes`,
    { method: "POST", body: input }
  );
}

export async function updateProgressNote(
  studentId: string,
  noteId: string,
  input: UpdateProgressNoteInput
) {
  const result = await apiRequest<{ message: string; progressNote: ProgressNote }>(
    `/api/students/${studentId}/learningProgress/notes/${noteId}`,
    { method: "PATCH", body: input }
  );
  return result.progressNote;
}

export async function deleteProgressNote(studentId: string, noteId: string) {
  return apiRequest<{ message: string }>(
    `/api/students/${studentId}/learningProgress/notes/${noteId}`,
    { method: "DELETE" }
  );
}
