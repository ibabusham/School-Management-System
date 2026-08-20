import { hash } from "bcrypt"; // hashes passwords before saving them

import { prisma } from "@/app/lib/prisma";
import type {
  CreateStudentInput,
  StudentListQuery,
  UpdateStudentInput,
} from "@/app/api/students/schemas";
import type { Student } from "@/prisma/generated/client";
import { AppError } from "@/app/utils/errors.utility";

// Removes the password field so it is never sent back in API responses
function toSafeStudent(student: Student) {
  const { ...safeStudent } = student;
  return safeStudent;
}

// Creates a new student row in the Student table
export async function createStudent(data: CreateStudentInput) {
  const hashedPassword = await hash(data.password, 10);

  const student = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: `${data.first_name} ${data.last_name}`,
        username: data.username,
        password: hashedPassword,
        role: "STUDENT",
        account_status: true,
      },
    });

    return tx.student.create({
      data: {
        student_id: parseInt(data.student_id),
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phonenumber: data.phonenumber,
        date_of_birth: data.date_of_birth,
        enrollment_date: data.enrollment_date,
        gender: data.gender,
        account_status: true,
        user: {
          connect: {
            id: user.id,
          },
        },
        learning_progress: {
          connect: {
            id: data.learning_progress_id,
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

  return student;
}

// Updates an existing active student (by user_id primary key)
/*
export async function updateStudent(userId: string, data: UpdateStudentInput) {
  // Make sure the student exists and is not soft-deleted
  await findActiveStudentById(userId);

  const updateData: UpdateStudentInput & { password?: string } = { ...data };

  // If a new password was provided, hash it before saving
  if (data.password) {
    updateData.password = await hash(data.password, 10);
  }

  const student = await prisma.student.update({
    where: { user_id: userId },
    data: updateData,
  });

  return toSafeStudent(student);
}
*/
export async function updateStudent(studentId: string, data: UpdateStudentInput) {
  await findActiveStudentById(studentId);

  const {  first_name, last_name, ...restProfile } = data;

  return prisma.$transaction(async (tx) => {
    return tx.student.update({
      where: { id: studentId },
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phonenumber: data.phonenumber,
        date_of_birth: data.date_of_birth,
        enrollment_date: data.enrollment_date,
        learning_progress_id: data.learning_progress_id,
        gender: data.gender,
        account_status: true,
      },
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
  
// Soft delete: mark the student inactive instead of removing the row

export async function deleteStudent(studentId: string) {
  await findActiveStudentById(studentId);

  const student = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: studentId },
      data: { account_status: false },
    });
  
  return tx.student.update({
    where: { id: studentId },
    data: { account_status: false },
    include: {
      user: {
        select: { id: true,
           name: true,
            username: true, 
            role: true, 
            account_status: true, 
            createdAt: true 
          },
      },
    },
  });
});
  return student;
}

// Returns a paginated list of active students only.
// Example: page=2, limit=10 → skip the first 10 rows, then take the next 10.
export async function listStudents(query : StudentListQuery) {
  // page = which page the client asked for (1, 2, 3, ...)
  // limit = how many students per page
  const { page, limit } = query;


  const skip = (page - 1) * limit;

  
  const where = { account_status: true };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
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

// Returns one active student by their user_id
export async function getStudentById(studentId: string) {
  const student = await findActiveStudentById(studentId);
  return toSafeStudent(student);
}

// Shared helper used by update / delete / details
async function findActiveStudentById(studentId: string) {
  const student = await prisma.student.findFirst({
    where: {
      id:studentId,
      account_status: true, // ignore soft-deleted students
    },
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  return student;
}
