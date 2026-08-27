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
export async function createExam(input: CreateExamInput) {
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

export async function getExam(id: string) {
  return findExamById(id);
}

export async function getExamList(query: ExamListQuery) {
  const { page, limit, subjectId } = query;
  const skip = (page - 1) * limit;
  const where = {
    ...(subjectId && { subjectId }),
  };

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

export async function deleteExam(id: string) {
  await findExamById(id);

  return prisma.exams.delete({
    where: { id },
    include: examInclude,
  });
}

export async function updateExam(id: string, input: UpdateExamInput) {
  await findExamById(id);
  if (input.subjectId) {
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

export async function markExam(examId: string, input: BulkMarkExamInput) {
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

  return { submissions };
}

export async function getTakenSubmissions(examId: string, query: SubmissionListQuery) {
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

export async function getMissingSubmissions(examId: string, query: SubmissionListQuery) {
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