import type { ExamSubmissions, Exams, Student } from "@/prisma/generated/client";

export {
  EXAM_CREATED_MESSAGE,
  EXAM_UPDATED_MESSAGE,
  EXAM_DELETED_MESSAGE,
  EXAM_MARKED_MESSAGE,
} from "@/app/api/shared/operation-messages";

export function toExamSummary(exam: Pick<Exams, "id" | "examName" | "examDate">) {
  return {
    id: exam.id,
    examName: exam.examName,
    examDate: exam.examDate,
  };
}

type SubmissionWithStudent = ExamSubmissions & {
  student: Pick<Student, "firstName" | "lastName">;
};

export function toTakenSubmissionSummary(submission: SubmissionWithStudent) {
  return {
    id: submission.id,
    studentId: submission.studentId,
    examId: submission.examId,
    score: submission.score,
    takenAt: submission.takenAt,
    firstName: submission.student.firstName,
    lastName: submission.student.lastName,
  };
}

export function toMarkSubmissionSummary(
  submission: Pick<ExamSubmissions, "id" | "studentId" | "examId" | "score">
) {
  return {
    id: submission.id,
    studentId: submission.studentId,
    examId: submission.examId,
    score: submission.score,
  };
}

export function buildMarkPagination(count: number) {
  return {
    page: 1,
    limit: count || 1,
    total: count,
    totalPages: Math.ceil(count / (count || 1)) || 1,
  };
}
