import type { Teacher } from "@/prisma/generated/client";

export {
  ACCOUNT_CREATED_MESSAGE,
  ACCOUNT_DELETED_MESSAGE,
} from "@/app/api/shared/operation-messages";

export function toTeacherSummary(
  teacher: Pick<Teacher, "id" | "employId" | "name" | "specilization">
) {
  return {
    id: teacher.id,
    employId: teacher.employId,
    name: teacher.name,
    specilization: teacher.specilization,
  };
}
