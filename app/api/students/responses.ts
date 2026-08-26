import type { Student } from "@/prisma/generated/client";

export {
  ACCOUNT_CREATED_MESSAGE,
  ACCOUNT_DELETED_MESSAGE,
} from "@/app/api/shared/operation-messages";

export function toStudentSummary(student: Pick<Student, "id" | "studentId" | "firstName" | "lastName">) {
  return {
    id: student.id,
    studentId: student.studentId,
    firstName: student.firstName,
    lastName: student.lastName,
  };
}
