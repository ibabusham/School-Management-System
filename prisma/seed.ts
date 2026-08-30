import "dotenv/config";
import { hash } from "bcrypt";
import { randomUUID } from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  Gender,
  PrismaClient,
  Role,
  Status,
} from "./generated/client";

const DEFAULT_PASSWORD = "Password123!";

const SEED = {
  adminUsername: "admin",
  teacherUsername: "teacher1",
  studentUsername: "student1",
  className: "Grade 10A",
  subjectCode: "MATH-10",
  yearName: "2025-2026",
  termName: "Term 1",
} as const;

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

async function ensureAdmin(prisma: PrismaClient, passwordHash: string) {
  return prisma.user.upsert({
    where: { username: SEED.adminUsername },
    update: { password: passwordHash, accountStatus: true },
    create: {
      name: "System Admin",
      username: SEED.adminUsername,
      password: passwordHash,
      role: Role.ADMIN,
      accountStatus: true,
    },
  });
}

async function ensureAcademicYear(prisma: PrismaClient) {
  const existing = await prisma.academicYears.findFirst({
    where: { yearName: SEED.yearName },
  });

  if (existing) {
    return existing;
  }

  return prisma.academicYears.create({
    data: {
      yearName: SEED.yearName,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-06-30"),
      status: Status.ACTIVE,
    },
  });
}

async function ensureTerm(prisma: PrismaClient, yearId: string) {
  const existing = await prisma.terms.findFirst({
    where: { termName: SEED.termName, yearId },
  });

  if (existing) {
    return existing;
  }

  return prisma.terms.create({
    data: {
      termName: SEED.termName,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2025-12-20"),
      yearId,
    },
  });
}

async function ensureClass(prisma: PrismaClient) {
  const existing = await prisma.classes.findFirst({
    where: { className: SEED.className },
  });

  if (existing) {
    return existing;
  }

  return prisma.classes.create({
    data: { className: SEED.className },
  });
}

async function linkClassToYear(
  prisma: PrismaClient,
  classId: string,
  yearId: string
) {
  await prisma.classAcademicYear.upsert({
    where: {
      classId_yearId: { classId, yearId },
    },
    update: {},
    create: { classId, yearId },
  });
}

async function ensureTeacher(prisma: PrismaClient, passwordHash: string) {
  const existing = await prisma.user.findUnique({
    where: { username: SEED.teacherUsername },
    include: { teacher: true },
  });

  if (existing?.teacher) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: passwordHash, accountStatus: true },
    });
    return existing.teacher;
  }

  const user = await prisma.user.create({
    data: {
      name: "Jane Teacher",
      username: SEED.teacherUsername,
      password: passwordHash,
      role: Role.TEACHER,
      accountStatus: true,
      teacher: {
        create: {
          name: "Jane Teacher",
          employId: 1001,
          email: "teacher1@school.test",
          phoneNumber: "0500000001",
          specilization: "Mathematics",
          accountStatus: true,
        },
      },
    },
    include: { teacher: true },
  });

  if (!user.teacher) {
    throw new Error("Failed to create teacher profile");
  }

  return user.teacher;
}

async function ensureSubject(
  prisma: PrismaClient,
  classId: string,
  teacherId: string
) {
  const existing = await prisma.subjects.findFirst({
    where: { subjectCode: SEED.subjectCode },
  });

  if (existing) {
    return existing;
  }

  return prisma.subjects.create({
    data: {
      subjectName: "Mathematics",
      subjectCode: SEED.subjectCode,
      description: "Grade 10 Mathematics",
      classId,
      teacherId,
    },
  });
}

async function ensureStudent(
  prisma: PrismaClient,
  passwordHash: string,
  classId: string
) {
  const existing = await prisma.user.findUnique({
    where: { username: SEED.studentUsername },
    include: { student: true },
  });

  if (existing?.student) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: passwordHash, accountStatus: true },
    });
    await prisma.student.update({
      where: { id: existing.id },
      data: { classId, accountStatus: true },
    });
    return existing.student;
  }

  const learningProgressId = randomUUID();
  await prisma.learningProgresses.create({
    data: {
      id: learningProgressId,
      subjectsAverages: 0,
      overallAvreages: 0,
      attendencePercentage: 0,
      learningStatus: Status.ACTIVE,
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "John Student",
      username: SEED.studentUsername,
      password: passwordHash,
      role: Role.STUDENT,
      accountStatus: true,
      student: {
        create: {
          studentId: 2001,
          firstName: "John",
          lastName: "Student",
          email: "student1@school.test",
          phoneNumber: "0500000002",
          dateOfBirth: new Date("2010-05-15"),
          enrollmentDate: new Date("2024-09-01"),
          gender: Gender.MALE,
          accountStatus: true,
          classId,
          learningProgressId,
        },
      },
    },
    include: { student: true },
  });

  if (!user.student) {
    throw new Error("Failed to create student profile");
  }

  return user.student;
}

async function ensureSampleExam(prisma: PrismaClient, subjectId: string) {
  const existing = await prisma.exams.findFirst({
    where: { examName: "Midterm Mathematics", subjectId },
  });

  if (existing) {
    return existing;
  }

  return prisma.exams.create({
    data: {
      examName: "Midterm Mathematics",
      examDate: new Date("2025-11-15"),
      maximumGrade: 100,
      subjectId,
    },
  });
}

async function ensureSampleAssignment(prisma: PrismaClient, subjectId: string) {
  const existing = await prisma.assignments.findFirst({
    where: { assignmentTitle: "Algebra Homework 1", subjectId },
  });

  if (existing) {
    return existing;
  }

  return prisma.assignments.create({
    data: {
      assignmentTitle: "Algebra Homework 1",
      assignmentDescription: "Complete exercises 1–10 from chapter 3.",
      dueDate: new Date("2025-10-20"),
      maximumGrade: 100,
      attachment: "https://example.com/homework.pdf",
      submissionInstructions: "Submit before the due date.",
      subjectId,
    },
  });
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run seed in production");
  }

  const prisma = createPrisma();
  const passwordHash = await hash(DEFAULT_PASSWORD, 10);

  try {
    await ensureAdmin(prisma, passwordHash);
    const year = await ensureAcademicYear(prisma);
    await ensureTerm(prisma, year.id);
    const schoolClass = await ensureClass(prisma);
    await linkClassToYear(prisma, schoolClass.id, year.id);

    const teacher = await ensureTeacher(prisma, passwordHash);
    const subject = await ensureSubject(prisma, schoolClass.id, teacher.id);
    await ensureStudent(prisma, passwordHash, schoolClass.id);
    await ensureSampleExam(prisma, subject.id);
    await ensureSampleAssignment(prisma, subject.id);

    console.log("Seed completed successfully.\n");
    console.log("Test accounts (password for all):", DEFAULT_PASSWORD);
    console.log(`  Admin:   ${SEED.adminUsername}`);
    console.log(`  Teacher: ${SEED.teacherUsername}`);
    console.log(`  Student: ${SEED.studentUsername}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
