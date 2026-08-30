import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/app/utils/errors.utility";
import type {
  AssignmentListQuery,
  BulkMarkAssignmentInput,
  CreateAssignmentInput,
  SubmissionListQuery,
  UpdateAssignmentInput,
} from "../schemas";
import { pickDefined } from "@/app/utils/pick-defined";
import { findSubjectById } from "@/app/api/subjects/Services/subjects.services";
import { recalculateLearningProgressForStudents } from "@/app/api/learning-progress/services/recalculate-learning-progress";
import { recalculateClassPerformance } from "@/app/api/classes/Services/recalculate-class-performance";
import type { ScopedSubjectIds } from "@/app/api/auth/services/teacher-scope";
import { buildSubjectIdScopeWhere } from "@/app/api/auth/services/teacher-scope";

const assignmentInclude = {
  subject: {
    include: {
      class: true,
      teacher: true,
    },
  },
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
async function findAssignmentById(id: string) {
  const assignment = await prisma.assignments.findUnique({
    where: { id },
    include: assignmentInclude,
  });

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  return assignment;
}
function mapCreateData(input: CreateAssignmentInput) {
  return {
    assignmentTitle: input.title,
    assignmentDescription: input.description,
    attachment: input.attachments,
    dueDate: input.dueDate,
    maximumGrade: input.maximumGrade,
    subjectId: input.subjectId,
    submissionInstructions: input.submissionInstructions,
  };
}
export async function createAssignment(input: CreateAssignmentInput) {
  await findSubjectById(input.subjectId);

  return prisma.assignments.create({
    data: mapCreateData(input),
    include: assignmentInclude,
  });
}
export async function getAssignment(id: string) {
  return findAssignmentById(id);
}
export async function getAssignmentList(
  query: AssignmentListQuery,
  scopedSubjectIds?: ScopedSubjectIds
) {
  const { page, limit, subjectId } = query;
  const skip = (page - 1) * limit;
  const where = buildSubjectIdScopeWhere(scopedSubjectIds, subjectId);

  const [assignments, total] = await Promise.all([
    prisma.assignments.findMany({
      where,
      skip,
      take: limit,
      include: assignmentInclude,
      orderBy: { dueDate: "desc" },
    }),
    prisma.assignments.count({ where }),
  ]);

  return {
    data: assignments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
export async function updateAssignment(id: string, input: UpdateAssignmentInput) {
  await findAssignmentById(id);

  if (input.subjectId) {
    await findSubjectById(input.subjectId);
  }
  
  if (input.maximumGrade !== undefined) {
    const { _max } = await prisma.assignmentSubmissions.aggregate({
      where: { assignmentID: id },
      _max: { score: true },
    });
  
    const highestScore = _max.score;
    if (highestScore !== null && input.maximumGrade < highestScore) {
      throw new AppError(
        `Maximum grade cannot be lower than an existing submission score of ${highestScore}`,
        400
      );
    }
  }

  return prisma.assignments.update({
    where: { id },
    data: pickDefined({
      assignmentTitle: input.title,
      assignmentDescription: input.description,
      attachment: input.attachments,
      dueDate: input.dueDate,
      maximumGrade: input.maximumGrade,
      subjectId: input.subjectId,
      submissionInstructions: input.submissionInstructions,
    }),
    include: assignmentInclude,
  });
}
export async function deleteAssignment(id: string) {
  await findAssignmentById(id);

  return prisma.assignments.delete({
    where: { id },
    include: assignmentInclude,
  });
}
async function assertStudentEligibleForAssignment(assignmentId: string, studentId: string) {
  const assignment = await findAssignmentById(assignmentId);

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      accountStatus: true,
      classId: assignment.subject.classId,
    },
  });

  if (!student) {
    throw new AppError("Student not found in this assignment's class", 404);
  }

  return { assignment, student };
}
export async function markAssignment(assignmentId: string, input: BulkMarkAssignmentInput) {
  const assignment = await findAssignmentById(assignmentId);

  for (const mark of input.marks) {
    if (mark.score > assignment.maximumGrade) {
      throw new AppError(
        `Score for student ${mark.studentId} cannot exceed maximum grade of ${assignment.maximumGrade}`,
        400
      );
    }
    await assertStudentEligibleForAssignment(assignmentId, mark.studentId);
  }

  const submissions = await prisma.$transaction(
    input.marks.map((mark) =>
      prisma.assignmentSubmissions.upsert({
        where: {
          assignmentID_studentId: {
            assignmentID: assignmentId,
            studentId: mark.studentId,
          },
        },
        create: {
          assignmentID: assignmentId,
          studentId: mark.studentId,
          score: mark.score,
        },
        update: {
          score: mark.score,
        },
      })
    )
  );

  const studentIds = [...new Set(input.marks.map((mark) => mark.studentId))];
  await recalculateLearningProgressForStudents(studentIds);
  await recalculateClassPerformance(assignment.subject.classId);
  
  return { submissions };
}
export async function getTakenSubmissions(assignmentId: string, query: SubmissionListQuery) {
  await findAssignmentById(assignmentId);

  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = { assignmentID: assignmentId };

  const [submissions, total] = await Promise.all([
    prisma.assignmentSubmissions.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { include: studentInclude },
      },
      orderBy: { takenAt: "desc" },
    }),
    prisma.assignmentSubmissions.count({ where }),
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
export async function getMissingSubmissions(assignmentId: string, query: SubmissionListQuery) {
  const assignment = await findAssignmentById(assignmentId);
  const classId = assignment.subject.classId;

  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    classId,
    accountStatus: true,
    assignmentSubmissions: {
      none: { assignmentID: assignmentId },
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
