import { apiRequest } from "@/lib/api/client";

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
