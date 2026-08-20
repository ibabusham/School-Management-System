import { randomUUID } from "crypto";
import { prisma } from "@/app/lib/prisma";
import type {
  CreateAcademicYear,
  UpdateAcademicYear,
  GetAcademicYear,
} from "@/app/api/academicYears/schemas";
import { AppError } from "@/app/utils/errors.utility";

export async function findAcademicYearById(id: string) {
  const academicYear = await prisma.academic_Years.findUnique({
    where: { id },
  });

  if (!academicYear) {
    throw new AppError("Academic year not found", 404);
  }

  return academicYear;
}

function mapUpdateData(data: UpdateAcademicYear) {
  const { id: _id, name, startDate, endDate } = data;

  return {
    ...(name !== undefined && { year_name: name }),
    ...(startDate !== undefined && { Start_date: startDate }),
    ...(endDate !== undefined && { end_date: endDate }),
  };
}

export async function createAcademicYear(data: CreateAcademicYear) {
  return prisma.academic_Years.create({
    data: {
      id: randomUUID(),
      year_name: data.name,
      Start_date: data.startDate,
      end_date: data.endDate,
      status: "ACTIVE",
    },
  });
}

export async function updateAcademicYear(id: string, data: UpdateAcademicYear) {
  await findAcademicYearById(id);

  return prisma.academic_Years.update({
    where: { id },
    data: mapUpdateData(data),
  });
}

export async function deleteAcademicYear(id: string) {
  await findAcademicYearById(id);

  return prisma.academic_Years.delete({
    where: { id },
  });
}

export async function findAcademicYear(data: GetAcademicYear) {
  const { page, limit, search } = data;
  const skip = (page - 1) * limit;
  const where = {
    ...(search && { year_name: { contains: search, mode: "insensitive" as const } }),
  };

  const [academicYears, total] = await Promise.all([
    prisma.academic_Years.findMany({
      where,
      skip,
      take: limit,
      orderBy: { Start_date: "desc" },
    }),
    prisma.academic_Years.count({ where }),
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
