import { prisma } from "@/app/lib/prisma";
import type { JwtPayload } from "@/app/api/auth/services/jwt";
import { assertStudentInTeacherScope } from "@/app/api/auth/services/teacher-scope";
import { AppError } from "@/app/utils/errors.utility";
import type {
  CreateProgressNoteInput,
  LearningProgressNotesQuery,
  UpdateProgressNoteInput,
} from "../schemas";

const progressNoteInclude = {
  teacher: {
    select: {
      id: true,
      name: true,
      employId: true,
      specilization: true,
    },
  },
} as const;

async function findActiveStudentById(studentId: string) {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      accountStatus: true,
    },
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  return student;
}

async function findLearningProgressForStudent(studentId: string) {
  const student = await findActiveStudentById(studentId);

  const learningProgress = await prisma.learningProgresses.findUnique({
    where: { id: student.learningProgressId },
  });

  if (!learningProgress) {
    throw new AppError("Learning progress not found", 404);
  }

  return { student, learningProgress };
}

async function findProgressNoteForStudent(studentId: string, noteId: string) {
  const { learningProgress } = await findLearningProgressForStudent(studentId);

  const note = await prisma.progressNotes.findFirst({
    where: {
      id: noteId,
      learningProgressId: learningProgress.id,
    },
    include: progressNoteInclude,
  });

  if (!note) {
    throw new AppError("Progress note not found", 404);
  }

  return note;
}

async function findTeacherById(teacherId: string) {
  const teacher = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      accountStatus: true,
    },
  });

  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  return teacher;
}

function resolveTeacherId(payload: JwtPayload, teacherId?: string) {
  if (payload.role === "ADMIN") {
    if (!teacherId) {
      throw new AppError("teacherId is required for admin", 400);
    }
    return teacherId;
  }

  if (payload.role === "TEACHER") {
    return payload.sub;
  }

  throw new AppError("Teacher or admin access required", 403);
}

function assertCanModifyNote(payload: JwtPayload, noteTeacherId: string) {
  if (payload.role === "ADMIN") {
    return;
  }

  if (payload.role === "TEACHER" && payload.sub === noteTeacherId) {
    return;
  }

  throw new AppError("You can only modify your own progress notes", 403);
}

function buildPagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getLearningProgress(studentId: string, query: LearningProgressNotesQuery) {
  const { learningProgress } = await findLearningProgressForStudent(studentId);
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = { learningProgressId: learningProgress.id };

  const [progressNotes, total] = await Promise.all([
    prisma.progressNotes.findMany({
      where,
      skip,
      take: limit,
      orderBy: { noteDate: "desc" },
      include: progressNoteInclude,
    }),
    prisma.progressNotes.count({ where }),
  ]);

  return {
    learningProgress,
    progressNotes,
    notesPagination: buildPagination(page, limit, total),
  };
}

export async function listProgressNotes(studentId: string, query: LearningProgressNotesQuery) {
  const { learningProgress } = await findLearningProgressForStudent(studentId);
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = { learningProgressId: learningProgress.id };

  const [data, total] = await Promise.all([
    prisma.progressNotes.findMany({
      where,
      skip,
      take: limit,
      orderBy: { noteDate: "desc" },
      include: progressNoteInclude,
    }),
    prisma.progressNotes.count({ where }),
  ]);

  return {
    data,
    pagination: buildPagination(page, limit, total),
  };
}

export async function createProgressNote(
  studentId: string,
  payload: JwtPayload,
  input: CreateProgressNoteInput
) {
  const { learningProgress } = await findLearningProgressForStudent(studentId);
  const teacherId = resolveTeacherId(payload, input.teacherId);
  await findTeacherById(teacherId);

  // Defense in depth: teacher must be scoped to the student's class
  if (payload.role === "TEACHER") {
    await assertStudentInTeacherScope(payload.sub, studentId);
  }

  return prisma.progressNotes.create({
    data: {
      noteDate: input.noteDate ?? new Date(),
      noteObservation: input.noteObservation,
      strengths: input.strengths,
      areasForImprovement: input.areasForImprovement,
      teacherId,
      learningProgressId: learningProgress.id,
    },
    include: progressNoteInclude,
  });
}

export async function getProgressNote(studentId: string, noteId: string) {
  return findProgressNoteForStudent(studentId, noteId);
}

export async function updateProgressNote(
  studentId: string,
  noteId: string,
  payload: JwtPayload,
  input: UpdateProgressNoteInput
) {
  const note = await findProgressNoteForStudent(studentId, noteId);
  assertCanModifyNote(payload, note.teacherId);

  return prisma.progressNotes.update({
    where: { id: noteId },
    data: {
      ...(input.noteDate !== undefined && { noteDate: input.noteDate }),
      ...(input.noteObservation !== undefined && { noteObservation: input.noteObservation }),
      ...(input.strengths !== undefined && { strengths: input.strengths }),
      ...(input.areasForImprovement !== undefined && {
        areasForImprovement: input.areasForImprovement,
      }),
    },
    include: progressNoteInclude,
  });
}

export async function deleteProgressNote(studentId: string, noteId: string, payload: JwtPayload) {
  const note = await findProgressNoteForStudent(studentId, noteId);
  assertCanModifyNote(payload, note.teacherId);

  return prisma.progressNotes.delete({
    where: { id: noteId },
    include: progressNoteInclude,
  });
}
