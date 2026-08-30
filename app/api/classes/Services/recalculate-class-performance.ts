import { prisma } from "@/app/lib/prisma";
import { Status } from "@/prisma/generated/client";

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

export async function ensureClassPerformanceRecord(classId: string) {
  await prisma.classesPerformence.upsert({
    where: { classId },
    create: {
      classId,
      classAvg: 0,
      highestGrade: 0,
      lowestGrade: 0,
      assignmentsCompleationRate: 0,
      attendenceRate: 0,
      studentRequiringSupport: 0,
      classStatus: Status.ACTIVE,
    },
    update: {},
  });
}

export async function recalculateClassPerformance(classId: string) {
  const students = await prisma.student.findMany({
    where: {
      classId,
      accountStatus: true,
    },
    include: {
      learningProgress: true,
    },
  });

  const subjects = await prisma.subjects.findMany({
    where: { classId },
    select: { id: true },
  });
  const subjectIds = subjects.map((subject) => subject.id);
  const studentIds = students.map((student) => student.id);

  const classAvg = averageRounded(
    students.map((student) => student.learningProgress.overallAvreages)
  );

  const attendenceRate = averageRounded(
    students.map((student) => student.learningProgress.attendencePercentage)
  );

  const studentRequiringSupport = students.filter(
    (student) =>
      student.learningProgress.overallAvreages < 50 ||
      student.learningProgress.attendencePercentage < 75
  ).length;

  const classStatus = classAvg >= 50 ? Status.ACTIVE : Status.INACTIVE;

  const gradedPercentages: number[] = [];
  let assignmentsCompleationRate = 0;

  if (studentIds.length > 0 && subjectIds.length > 0) {
    const [examSubmissions, assignmentSubmissions, assignments] = await Promise.all([
      prisma.examSubmissions.findMany({
        where: {
          studentId: { in: studentIds },
          score: { not: null },
          exam: { subjectId: { in: subjectIds } },
        },
        include: {
          exam: {
            select: { maximumGrade: true },
          },
        },
      }),
      prisma.assignmentSubmissions.findMany({
        where: {
          studentId: { in: studentIds },
          score: { not: null },
          assignment: { subjectId: { in: subjectIds } },
        },
        include: {
          assignment: {
            select: { maximumGrade: true },
          },
        },
      }),
      prisma.assignments.findMany({
        where: { subjectId: { in: subjectIds } },
        select: { id: true },
      }),
    ]);

    for (const submission of examSubmissions) {
      if (submission.score === null) {
        continue;
      }

      gradedPercentages.push(
        scoreToPercentage(submission.score, submission.exam.maximumGrade)
      );
    }

    for (const submission of assignmentSubmissions) {
      if (submission.score === null) {
        continue;
      }

      gradedPercentages.push(
        scoreToPercentage(submission.score, submission.assignment.maximumGrade)
      );
    }

    const assignmentIds = assignments.map((assignment) => assignment.id);
    const totalSlots = assignmentIds.length * studentIds.length;

    if (totalSlots > 0) {
      const filledSlots = await prisma.assignmentSubmissions.count({
        where: {
          assignmentID: { in: assignmentIds },
          studentId: { in: studentIds },
          score: { not: null },
        },
      });

      assignmentsCompleationRate = Math.round((filledSlots / totalSlots) * 100);
    }
  }

  const highestGrade = gradedPercentages.length > 0 ? Math.max(...gradedPercentages) : 0;
  const lowestGrade = gradedPercentages.length > 0 ? Math.min(...gradedPercentages) : 0;

  await prisma.classesPerformence.upsert({
    where: { classId },
    create: {
      classId,
      classAvg,
      highestGrade,
      lowestGrade,
      assignmentsCompleationRate,
      attendenceRate,
      studentRequiringSupport,
      classStatus,
    },
    update: {
      classAvg,
      highestGrade,
      lowestGrade,
      assignmentsCompleationRate,
      attendenceRate,
      studentRequiringSupport,
      classStatus,
    },
  });
}
