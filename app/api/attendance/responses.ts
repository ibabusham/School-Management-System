import type { Attendences } from "@/prisma/generated/client";

export {
  ATTENDANCE_CREATED_MESSAGE,
  ATTENDANCE_UPDATED_MESSAGE,
  ATTENDANCE_DELETED_MESSAGE,
} from "@/app/api/shared/operation-messages";

export function toAttendance(record: Attendences) {
  return {
    id: record.id,
    attendanceDate: record.attendanceDate,
    attendanceStatus: record.attendanceStatus,
    attendancePercentage: record.attendancePercentage,
    studentId: record.studentId,
    subjectId: record.subjectId,
  };
}
