import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/app/utils/errors.utility";
import type {
  BulkMarkExamInput,
  CreateExamInput,
  ExamListQuery,
  SubmissionListQuery,
  UpdateExamInput,
} from "../schemas";
import { pickDefined } from "@/app/utils/pick-defined";
import { findSubjectById } from "@/app/api/subjects/Services/subjects.services";
import { recalculateLearningProgressForStudents } from "@/app/api/learning-progress/services/recalculate-learning-progress";
import { recalculateClassPerformance } from "@/app/api/classes/Services/recalculate-class-performance";
import type { JwtPayload } from "@/app/api/auth/services/jwt";
import {
  buildSubjectIdScopeWhere,
  getScopedSubjectIds,
  requireTeacherOwnsExam,
  requireTeacherOwnsSubject,
} from "@/app/api/auth/services/teacher-scope";
const examInclude = {
  subject: {
    include: {
      class: true,
      teacher: true,
    },
  },
  submissions: true,
} as const;

const studentInclude = {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      accountStatus: true,
      createdAt: true,
    },
  },
} as const;
async function findExamById(id: string) {
  const exam = await prisma.exams.findUnique({
    where: { id },
    include: examInclude,
  });

  if (!exam) {
    throw new AppError("Exam not found", 404);
  }

  return exam;
}
export async function createExam(input: CreateExamInput, auth: JwtPayload) {
  await requireTeacherOwnsSubject(auth, input.subjectId);
  await findSubjectById(input.subjectId);

  return prisma.exams.create({
    data: {
      examName: input.examName,
      examDate: input.examDate,
      subjectId: input.subjectId,
      maximumGrade: input.maximumGrade,
    },
    include: examInclude,
  });
}

export async function getExam(id: string, auth: JwtPayload) {
  await requireTeacherOwnsExam(auth, id);
  return findExamById(id);
}

export async function getExamList(query: ExamListQuery, auth: JwtPayload) {
  const scopedSubjectIds = await getScopedSubjectIds(auth);
  const { page, limit, subjectId } = query;
  const skip = (page - 1) * limit;
  const where = buildSubjectIdScopeWhere(scopedSubjectIds, subjectId);

  const [exams, total] = await Promise.all([
    prisma.exams.findMany({
      where,
      skip,
      take: limit,
      include: examInclude,
      orderBy: { examDate: "desc" },
    }),
    prisma.exams.count({ where }),
  ]);

  return {
    data: exams,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function deleteExam(id: string, auth: JwtPayload) {
  await requireTeacherOwnsExam(auth, id);
  await findExamById(id);

  return prisma.exams.delete({
    where: { id },
    include: examInclude,
  });
}

export async function updateExam(id: string, input: UpdateExamInput, auth: JwtPayload) {
  await requireTeacherOwnsExam(auth, id);
  await findExamById(id);
  if (input.subjectId) {
    await requireTeacherOwnsSubject(auth, input.subjectId);
    await findSubjectById(input.subjectId);
  }
return prisma.exams.update({
  where: { id },
  data: pickDefined(input),
  include: examInclude,
});
}

async function assertStudentEligibleForExam(examId: string, studentId: string) {
  const exam = await findExamById(examId);

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      accountStatus: true,
      classId: exam.subject.classId,
    },
  });

  if (!student) {
    throw new AppError("Student not found in this exam's class", 404);
  }

  return { exam, student };
}

export async function markExam(examId: string, input: BulkMarkExamInput, auth: JwtPayload) {
  await requireTeacherOwnsExam(auth, examId);
  const exam = await findExamById(examId);

  for (const mark of input.marks) {
    if (mark.score > exam.maximumGrade) {
      throw new AppError(
        `Score for student ${mark.studentId} cannot exceed maximum grade of ${exam.maximumGrade}`,
        400
      );
    }
    await assertStudentEligibleForExam(examId, mark.studentId);
  }

  const submissions = await prisma.$transaction(
    input.marks.map((mark) =>
      prisma.examSubmissions.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId: mark.studentId,
          },
        },
        create: {
          examId,
          studentId: mark.studentId,
          score: mark.score,
        },
        update: {
          score: mark.score,
        },
        include: {
          student: { include: studentInclude },
        },
      })
    )
  );

  const studentIds = [...new Set(input.marks.map((mark) => mark.studentId))];
  await recalculateLearningProgressForStudents(studentIds);
  await recalculateClassPerformance(exam.subject.classId);

  return { submissions };
}

export async function getTakenSubmissions(
  examId: string,
  query: SubmissionListQuery,
  auth: JwtPayload
) {
  await requireTeacherOwnsExam(auth, examId);
  await findExamById(examId);

  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = { examId };

  const [submissions, total] = await Promise.all([
    prisma.examSubmissions.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { include: studentInclude },
      },
      orderBy: { takenAt: "desc" },
    }),
    prisma.examSubmissions.count({ where }),
  ]);

  return {
    data: submissions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getMissingSubmissions(
  examId: string,
  query: SubmissionListQuery,
  auth: JwtPayload
) {
  await requireTeacherOwnsExam(auth, examId);
  const exam = await findExamById(examId);
  const classId = exam.subject.classId;

  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    classId,
    accountStatus: true,
    examSubmissions: {
      none: { examId },
    },
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      include: studentInclude,
      orderBy: { lastName: "asc" },
    }),
    prisma.student.count({ where }),
  ]);

  return {
    data: students,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}