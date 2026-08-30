import { prisma } from "@/app/lib/prisma";
import { Status } from "@/prisma/generated/client";

const ATTENDED_STATUSES = new Set(["PRESENT", "LATE", "EXCUSED"]);

function scoreToPercentage(score: number, maximumGrade: number) {
  if (maximumGrade <= 0) {
    return 0;
  }

  return Math.round((score / maximumGrade) * 100);
}

function averageRounded(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export async function recalculateLearningProgressForStudent(studentId: string) {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      accountStatus: true,
    },
    select: {
      learningProgressId: true,
    },
  });

  if (!student) {
    return;
  }

  const [examSubmissions, assignmentSubmissions, attendances] = await Promise.all([
    prisma.examSubmissions.findMany({
      where: {
        studentId,
        score: { not: null },
      },
      include: {
        exam: {
          select: {
            maximumGrade: true,
            subjectId: true,
          },
        },
      },
    }),
    prisma.assignmentSubmissions.findMany({
      where: {
        studentId,
        score: { not: null },
      },
      include: {
        assignment: {
          select: {
            maximumGrade: true,
            subjectId: true,
          },
        },
      },
    }),
    prisma.attendences.findMany({
      where: { studentId },
      select: { attendanceStatus: true },
    }),
  ]);

  const overallPercentages: number[] = [];
  const subjectPercentages = new Map<string, number[]>();

  for (const submission of examSubmissions) {
    if (submission.score === null) {
      continue;
    }

    const percentage = scoreToPercentage(submission.score, submission.exam.maximumGrade);
    overallPercentages.push(percentage);

    const subjectValues = subjectPercentages.get(submission.exam.subjectId) ?? [];
    subjectValues.push(percentage);
    subjectPercentages.set(submission.exam.subjectId, subjectValues);
  }

  for (const submission of assignmentSubmissions) {
    if (submission.score === null) {
      continue;
    }

    const percentage = scoreToPercentage(
      submission.score,
      submission.assignment.maximumGrade
    );
    overallPercentages.push(percentage);

    const subjectValues = subjectPercentages.get(submission.assignment.subjectId) ?? [];
    subjectValues.push(percentage);
    subjectPercentages.set(submission.assignment.subjectId, subjectValues);
  }

  const overallAvreages = averageRounded(overallPercentages);
  const subjectsAverages = averageRounded(
    [...subjectPercentages.values()].map((values) => averageRounded(values))
  );

  const attendencePercentage =
    attendances.length === 0
      ? 0
      : Math.round(
          (attendances.filter((record) => ATTENDED_STATUSES.has(record.attendanceStatus))
            .length /
            attendances.length) *
            100
        );

  const learningStatus = overallAvreages >= 50 ? Status.ACTIVE : Status.INACTIVE;

  await prisma.learningProgresses.update({
    where: { id: student.learningProgressId },
    data: {
      subjectsAverages,
      overallAvreages,
      attendencePercentage,
      learningStatus,
    },
  });
}

export async function recalculateLearningProgressForStudents(studentIds: string[]) {
  const uniqueStudentIds = [...new Set(studentIds)];

  await Promise.all(
    uniqueStudentIds.map((studentId) => recalculateLearningProgressForStudent(studentId))
  );
}
