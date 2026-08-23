import { prisma } from "@/app/lib/prisma";
import { CreateTermInput, TermListQuery, UpdateTermInput } from "../schemas";
import { randomUUID } from "crypto";
export const createTerm = async (term: CreateTermInput) => {
    const newTerm = await prisma.terms.create({
        data: {
         id: randomUUID(),
            term_name: term.name,
            Start_date: term.startDate || new Date(),
            end_date: term.endDate || new Date(),
            yearId: term.yearId,
            
        },
    });
    return newTerm;
};      

export const updateTerm = async (id: string, term: UpdateTermInput) => {
    const updatedTerm = await prisma.terms.update({
        where: { id },
        data: {
            name: term.name,
            start_date: term.startDate,
            end_date: term.endDate || new Date(),
            status: term.status,
            yearId: term.yearId,
           
        },
    });
    return updatedTerm;
};

export const deleteTerm = async (id: string) => {
    const deletedTerm = await prisma.terms.delete({
        where: { id },
    });
    return deletedTerm;
};

export const getTerm = async (id: string) => {
    const term = await prisma.terms.findUnique({
        where: { id },
    });
    return term;
};
export const getTerms = async (query: TermListQuery) => {
    const { page, limit, search } = query;
    const terms = await prisma.terms.findMany({
        where: {
            term_name: { contains: search, mode: "insensitive" },
        },
    });
    return {
        data: terms,
        total: terms.length,
        page: page,
        limit: limit,
    };
};