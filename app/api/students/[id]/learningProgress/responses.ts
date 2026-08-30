import type { LearningProgresses, ProgressNotes, Teacher } from "@/prisma/generated/client";

export {
  PROGRESS_NOTE_CREATED_MESSAGE,
  PROGRESS_NOTE_UPDATED_MESSAGE,
  PROGRESS_NOTE_DELETED_MESSAGE,
} from "@/app/api/shared/operation-messages";

type ProgressNoteWithTeacher = ProgressNotes & {
  teacher?: Pick<Teacher, "id" | "name" | "employId" | "specilization">;
};

export function toTeacherSummary(teacher: Pick<Teacher, "id" | "name" | "employId" | "specilization">) {
  return {
    id: teacher.id,
    name: teacher.name,
    employId: teacher.employId,
    specilization: teacher.specilization,
  };
}

export function toProgressNote(note: ProgressNoteWithTeacher) {
  return {
    id: note.id,
    noteDate: note.noteDate,
    noteObservation: note.noteObservation,
    strengths: note.strengths,
    areasForImprovement: note.areasForImprovement,
    teacherId: note.teacherId,
    learningProgressId: note.learningProgressId,
    teacher: note.teacher ? toTeacherSummary(note.teacher) : undefined,
  };
}

export function toLearningProgress(
  learningProgress: LearningProgresses,
  progressNotes: ProgressNoteWithTeacher[]
) {
  return {
    id: learningProgress.id,
    subjectsAverages: learningProgress.subjectsAverages,
    overallAvreages: learningProgress.overallAvreages,
    attendencePercentage: learningProgress.attendencePercentage,
    learningStatus: learningProgress.learningStatus,
    progressNotes: progressNotes.map(toProgressNote),
  };
}
