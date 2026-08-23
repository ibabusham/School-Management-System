import { randomUUID } from "crypto";
import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/app/utils/errors.utility";
import type { CreateTermInput, TermListQuery, UpdateTermInput } from "../schemas";

const termInclude = {
  year: true,
} as const;

async function findAcademicYearById(id: string) {
  const academicYear = await prisma.academic_Years.findUnique({ where: { id } });

  if (!academicYear) {
    throw new AppError("Academic year not found", 404);
  }

  return academicYear;
}

async function findTermById(id: string) {
  const term = await prisma.terms.findUnique({
    where: { id },
    include: termInclude,
  });

  if (!term) {
    throw new AppError("Term not found", 404);
  }

  return term;
}

function mapUpdateData(data: UpdateTermInput) {
  const { name, startDate, endDate, yearId } = data;

  return {
    ...(name !== undefined && { term_name: name }),
    ...(startDate !== undefined && { Start_date: startDate }),
    ...(endDate !== undefined && { end_date: endDate }),
    ...(yearId !== undefined && { yearId }),
  };
}

export async function createTerm(term: CreateTermInput) {
  await findAcademicYearById(term.yearId);

  return prisma.terms.create({
    data: {
      id: randomUUID(),
      term_name: term.name,
      Start_date: term.startDate,
      end_date: term.endDate,
      yearId: term.yearId,
    },
    include: termInclude,
  });
}

export async function updateTerm(id: string, term: UpdateTermInput) {
  await findTermById(id);

  if (term.yearId) {
    await findAcademicYearById(term.yearId);
  }

  return prisma.terms.update({
    where: { id },
    data: mapUpdateData(term),
    include: termInclude,
  });
}

export async function deleteTerm(id: string) {
  await findTermById(id);

  return prisma.terms.delete({
    where: { id },
    include: termInclude,
  });
}

export async function getTerm(id: string) {
  return findTermById(id);
}

export async function getTerms(query: TermListQuery) {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;
  const where = {
    ...(search && { term_name: { contains: search, mode: "insensitive" as const } }),
  };

  const [terms, total] = await Promise.all([
    prisma.terms.findMany({
      where,
      skip,
      take: limit,
      include: termInclude,
      orderBy: { Start_date: "desc" },
    }),
    prisma.terms.count({ where }),
  ]);

  return {
    data: terms,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
