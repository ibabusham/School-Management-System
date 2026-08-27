import { hash } from "bcrypt";
import { prisma } from "@/app/lib/prisma";
import type {
  CreateTeacherInput,
  TeacherListQuery,
  UpdateTeacherInput,
} from "@/app/api/teachers/schemas";
import type { Teacher } from "@/prisma/generated/client";
import { AppError } from "@/app/utils/errors.utility";
import { pickDefined } from "@/app/utils/pick-defined";

function toSafeTeacher(teacher: Teacher) {
  const { ...safeTeacher } = teacher;
  return safeTeacher;
}
export async function createTeacher(data: CreateTeacherInput) {
  const hashedPassword = await hash(data.password, 10);
  const existingUser = await prisma.user.findUnique({ where: { username: data.username } });
  const existing = await prisma.teacher.findUnique({
    where: {
      employId: data.employId,
    },
  });
  if (existing) {
    throw new AppError("Teacher id already exists", 400);
  }

  if (existingUser) throw new AppError("Username already exists", 400);

  const teacher = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        username: data.username,
        password: hashedPassword,
        role: "TEACHER",
        accountStatus: true,
      },
    });
    return tx.teacher.create({
      data: {
        email: data.email,
        name: data.name,
        employId: data.employId,
        phoneNumber: data.phoneNumber ?? " ",
        specilization: data.specilization,
        accountStatus: true,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
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
      },
    });
  });

  return teacher;
}
export async function updateTeacher(teacherId: string, data: UpdateTeacherInput) {
  await findActiveTeacherById(teacherId);

 return prisma.teacher.update({
  where: { id: teacherId },
  data: pickDefined(data),
  include: {
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
  },
});
}
export async function deleteTeacher(teacherId: string) {
  await findActiveTeacherById(teacherId);

  const teacher = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: {
        teacher: {
          id: teacherId,
        },
      },
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    await tx.user.update({
      where: { id: user.id },
      data: { accountStatus: false },
    });
    return tx.teacher.update({
      where: { id: teacherId },
      data: { accountStatus: false },
      include: {
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
      },
    });
  });
  return teacher;
}
export async function listTeachers(query: TeacherListQuery) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = { accountStatus: true };

  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      skip,
      take: limit,
      orderBy: { user: { createdAt: "desc" } },
      include: {
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
      },
    }),
    prisma.teacher.count({ where }),
  ]);

  return {
    data: teachers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
export async function getTeacherById(userId: string) {
  const teacher = await findActiveTeacherById(userId);
  return toSafeTeacher(teacher);
}
async function findActiveTeacherById(teacherId: string) {
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
export async function findTeacherById(id: string) {
  const teacher = await prisma.teacher.findFirst({
    where: { id, accountStatus: true },
  });
  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }
  return teacher;
}