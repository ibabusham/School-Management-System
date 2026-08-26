import type { Subjects } from "@/prisma/generated/client";

export {
  SUBJECT_CREATED_MESSAGE,
  SUBJECT_UPDATED_MESSAGE,
  SUBJECT_DELETED_MESSAGE,
} from "@/app/api/shared/operation-messages";

export function toSubjectSummary(
  subject: Pick<Subjects, "id" | "subjectName" | "subjectCode">
) {
  return {
    id: subject.id,
    subjectName: subject.subjectName,
    subjectCode: subject.subjectCode,
  };
}
