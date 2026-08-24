import { hash } from "bcrypt";
import { prisma } from "@/app/lib/prisma";
import type {
  CreateTeacherInput,
  TeacherListQuery,
  UpdateTeacherInput,
} from "@/app/api/teachers/schemas";
import type { Teacher } from "@/prisma/generated/client";
import { AppError } from "@/app/utils/errors.utility";

function toSafeTeacher(teacher: Teacher) {
  const {...safeTeacher } = teacher;
  return safeTeacher;
}

export async function createTeacher(data: CreateTeacherInput) {
  const hashedPassword = await hash(data.password, 10);
const existing = await prisma.teacher.findUnique({
  where: {
    employ_id: parseInt(data.employ_id),
  },
});
if(existing) {
  throw new AppError("Teacher id already exists", 400);
}
  
  const teacher = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        username: data.username,
        password: hashedPassword,
        role: "TEACHER",
        account_status: true,
      },
    });
    return tx.teacher.create({
      data: {
        email: data.email,
        name: data.name,
        employ_id: parseInt(data.employ_id),
        phonenumber: data.phonenumber ?? " ",
        specilization: data.specilization,
        account_status: true,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        user: {
          select: { id: true,
             name: true, 
             username: true,
              role: true,
               account_status: true,
               createdAt: true },
        },
      },
    });
  });

  return teacher; // no password on Teacher; user select omits password
}

export async function updateTeacher(teacherId: string, data: UpdateTeacherInput) {
  await findActiveTeacherById(teacherId);

  const { name, ...profileData } = data;

  return prisma.$transaction(async (tx) => {
    return tx.teacher.update({
      where: { id: teacherId },
      data: profileData, // only employ_id, email, phonenumber, specilization
      include: {
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
      },
    });
  });
}
// Soft delete: mark the teacher inactive instead of removing the row

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
      data: { account_status: false },
    });
    return tx.teacher.update({
      where: { id: teacherId },
      data: { account_status: false },
      include: {
        user: {
          select: { id: true, name: true, username: true, role: true, account_status: true, createdAt: true },
        },
      },
    });
});
  return teacher;
}
// Returns a paginated list of active teachers only.
// Example: page=2, limit=10 → skip the first 10 rows, then take the next 10.
export async function listTeachers(query: TeacherListQuery) {
  // page = which page the client asked for (1, 2, 3, ...)
  // limit = how many teachers per page
  const { page, limit } = query;

  // How many rows to skip before reading this page
  // page 1 → skip 0, page 2 → skip 10 (if limit is 10), etc.
  const skip = (page - 1) * limit;

  // Soft-deleted teachers have account_status = false, so hide them from the list
  const where = { account_status: true };

  // Run both queries together for speed:
  // 1) findMany → the teachers for this page
  // 2) count   → total active teachers (needed to build pagination info)
  // include.user.select = list shaping: attach safe User fields (no password)
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
            account_status: true,
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
      account_status: true,
    },
  });

  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  return teacher;
}
