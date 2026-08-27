import { randomUUID } from "crypto";
import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/app/utils/errors.utility";
import type { CreateTermInput, TermListQuery, UpdateTermInput } from "../schemas";
import { pickDefined } from "@/app/utils/pick-defined";
import { findAcademicYearById } from "@/app/api/academicYears/services/academicyear.services";

const termInclude = {
  year: true,
} as const;

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
export async function createTerm(term: CreateTermInput) {
  await findAcademicYearById(term.yearId);
  const termsCount = await prisma.terms.count({
    where: {
      yearId: term.yearId,
    },
  });
  if (termsCount >= 2) {
    throw new AppError("A maximum of 2 terms can be created for an academic year", 400);
  }

  return prisma.terms.create({
    data: {
      id: randomUUID(),
      termName: term.termName,
      startDate: term.startDate,
      endDate: term.endDate,
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
  data: pickDefined(term),
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
    ...(search && { termName: { contains: search, mode: "insensitive" as const } }),
  };

  const [terms, total] = await Promise.all([
    prisma.terms.findMany({
      where,
      skip,
      take: limit,
      include: termInclude,
      orderBy: { startDate: "desc" },
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
