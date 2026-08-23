import { randomUUID } from "crypto";
import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/app/utils/errors.utility";
import type {
  BulkMarkExamInput,
  CreateExamInput,
  ExamListQuery,
  SubmissionListQuery,
  UpdateExamInput,
} from "../schemas";

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
      account_status: true,
      createdAt: true,
    },
  },
} as const;

async function findSubjectById(id: string) {
  const subject = await prisma.subjects.findUnique({
    where: { id },
    include: { class: true },
  });

  if (!subject) {
    throw new AppError("Subject not found", 404);
  }

  return subject;
}

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

function mapUpdateData(data: UpdateExamInput) {
  const { exam_name, exam_date, subject_id, maximum_grade } = data;

  return {
    ...(exam_name !== undefined && { exam_name }),
    ...(exam_date !== undefined && { exam_date }),
    ...(subject_id !== undefined && { subjectId: subject_id }),
    ...(maximum_grade !== undefined && { Maximum_grade: maximum_grade }),
  };
}

export async function createExam(input: CreateExamInput) {
  await findSubjectById(input.subject_id);

  return prisma.exams.create({
    data: {
      id: randomUUID(),
      exam_name: input.exam_name,
      exam_date: input.exam_date,
      subjectId: input.subject_id,
      Maximum_grade: input.maximum_grade,
    },
    include: examInclude,
  });
}

export async function getExam(id: string) {
  return findExamById(id);
}

export async function getExamList(query: ExamListQuery) {
  const { page, limit, subject_id } = query;
  const skip = (page - 1) * limit;
  const where = {
    ...(subject_id && { subjectId: subject_id }),
  };

  const [exams, total] = await Promise.all([
    prisma.exams.findMany({
      where,
      skip,
      take: limit,
      include: examInclude,
      orderBy: { exam_date: "desc" },
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

  if (input.subject_id) {
    await findSubjectById(input.subject_id);
  }

  return prisma.exams.update({
    where: { id },
    data: mapUpdateData(input),
    include: examInclude,
  });
}

async function assertStudentEligibleForExam(examId: string, studentId: string) {
  const exam = await findExamById(examId);

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      account_status: true,
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
    if (mark.score > exam.Maximum_grade) {
      throw new AppError(
        `Score for student ${mark.student_id} cannot exceed maximum grade of ${exam.Maximum_grade}`,
        400
      );
    }
    await assertStudentEligibleForExam(examId, mark.student_id);
  }

  const submissions = await prisma.$transaction(
    input.marks.map((mark) =>
      prisma.exam_submissions.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId: mark.student_id,
          },
        },
        create: {
          id: randomUUID(),
          examId,
          studentId: mark.student_id,
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

  return { submissions, markedCount: submissions.length };
}

export async function getTakenSubmissions(examId: string, query: SubmissionListQuery) {
  await findExamById(examId);

  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = { examId };

  const [submissions, total] = await Promise.all([
    prisma.exam_submissions.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { include: studentInclude },
      },
      orderBy: { takenAt: "desc" },
    }),
    prisma.exam_submissions.count({ where }),
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
    account_status: true,
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
      orderBy: { last_name: "asc" },
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
