import { randomUUID } from "crypto";
import { prisma } from "@/app/lib/prisma";
import type {
  CreateAcademicYear,
  UpdateAcademicYear,
  GetAcademicYear,
} from "@/app/api/academicYears/schemas";
import { AppError } from "@/app/utils/errors.utility";

export async function findAcademicYearById(id: string) {
  const academicYear = await prisma.academicYears.findUnique({
    where: { id },
  });

  if (!academicYear) {
    throw new AppError("Academic year not found", 404);
  }

  return academicYear;
}

function mapUpdateData(data: UpdateAcademicYear) {
  const { id: _id, yearName, startDate, endDate } = data;

  return {
    ...(yearName !== undefined && { yearName }),
    ...(startDate !== undefined && { startDate }),
    ...(endDate !== undefined && { endDate }),
  };
}

export async function createAcademicYear(data: CreateAcademicYear) {
  const activeAcademicYear = await prisma.academicYears.findFirst({
    where: {
      status: "ACTIVE",
    },
  });
  if (activeAcademicYear) {
    throw new AppError("Only one academic year can be active at a time", 400);
  }
  return prisma.academicYears.create({
    data: {
      id: randomUUID(),
      yearName: data.yearName,
      startDate: data.startDate,
      endDate: data.endDate,
      status: "ACTIVE",
    },
  });
}

export async function updateAcademicYear(id: string, data: UpdateAcademicYear) {
  await findAcademicYearById(id);
  const active = await prisma.academicYears.findFirst({
    where: { status: "ACTIVE", NOT: { id } },
  });
  if (active) throw new AppError("Only one academic year can be active at a time", 400);

  return prisma.academicYears.update({
    where: { id },
    data: mapUpdateData(data),
  });
}

export async function deleteAcademicYear(id: string) {
  await findAcademicYearById(id);

  return prisma.academicYears.delete({
    where: { id },
  });
}

export async function findAcademicYear(data: GetAcademicYear) {
  const { page, limit, search } = data;
  const skip = (page - 1) * limit;
  const where = {
    ...(search && { yearName: { contains: search, mode: "insensitive" as const } }),
  };

  const [academicYears, total] = await Promise.all([
    prisma.academicYears.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startDate: "desc" },
    }),
    prisma.academicYears.count({ where }),
  ]);

  return {
    data: academicYears,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
