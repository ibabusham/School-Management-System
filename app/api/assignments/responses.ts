import type { AssignmentSubmissions, Assignments, Student } from "@/prisma/generated/client";

export {
  ASSIGNMENT_CREATED_MESSAGE,
  ASSIGNMENT_UPDATED_MESSAGE,
  ASSIGNMENT_DELETED_MESSAGE,
  ASSIGNMENT_MARKED_MESSAGE,
} from "@/app/api/shared/operation-messages";

export function toAssignmentSummary(
  assignment: Pick<
    Assignments,
    | "id"
    | "assignmentTitle"
    | "assignmentDescription"
    | "dueDate"
    | "maximumGrade"
    | "subjectId"
  >
) {
  return {
    id: assignment.id,
    assignmentTitle: assignment.assignmentTitle,
    assignmentDescription: assignment.assignmentDescription,
    dueDate: assignment.dueDate,
    maximumGrade: assignment.maximumGrade,
    subjectId: assignment.subjectId,
  };
}

export function toAssignment(assignment: Assignments) {
  return {
    id: assignment.id,
    assignmentTitle: assignment.assignmentTitle,
    assignmentDescription: assignment.assignmentDescription,
    attachment: assignment.attachment,
    dueDate: assignment.dueDate,
    maximumGrade: assignment.maximumGrade,
    subjectId: assignment.subjectId,
    submissionInstructions: assignment.submissionInstructions,
  };
}

type SubmissionWithStudent = AssignmentSubmissions & {
  student: Pick<Student, "firstName" | "lastName">;
};

export function toTakenSubmissionSummary(submission: SubmissionWithStudent) {
  return {
    id: submission.id,
    assignmentId: submission.assignmentID,
    studentId: submission.studentId,
    score: submission.score,
    takenAt: submission.takenAt,
    firstName: submission.student.firstName,
    lastName: submission.student.lastName,
  };
}

export function toMarkSubmissionSummary(
  submission: Pick<AssignmentSubmissions, "id" | "studentId" | "assignmentID" | "score">
) {
  return {
    id: submission.id,
    assignmentId: submission.assignmentID,
    studentId: submission.studentId,
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
