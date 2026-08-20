import { prisma } from "@/app/lib/prisma";
import { AssignSubjectToTeacherInput, CreateSubjectInput, GetSubjectListQueryInput, UnassignSubjectFromClassInput, UnassignSubjectFromTeacherInput, UpdateSubjectInput , AssignSubjectToClassInput} from "../schemas";
import { randomUUID } from "crypto";

export async function createSubject(data: CreateSubjectInput) {
  return prisma.subjects.create({ data: {
    id: randomUUID(),
    subject_name: data.subject_name,
    subject_code: data.subject_code,
    classId: data.class_id,
    teacherId: data.teacher_id,
    Description: data.subject_description,
  } });
}
export async function updateSubject(data: UpdateSubjectInput) {
  return prisma.subjects.update({ where: { id: data.subject_id }, data });
}
export async function deleteSubject(id: string) {
  return prisma.subjects.delete({ where: { id } });
}
export async function getSubjectById(id: string) {
  return prisma.subjects.findUnique({ where: { id } });
}
export async function getSubjectList(data: GetSubjectListQueryInput) {
  const { page, limit } = data;
  const skip = (page - 1) * limit;
  const subjects = await prisma.subjects.findMany({
    skip,
    take: limit,
    include: {
      class: true,
      teacher: true,
    },
  });
  return subjects;
}
export async function assignSubjectToClass(data: AssignSubjectToClassInput) {
  return prisma.subjects.update({ where: { id: data.subject_id }, data: { classId: data.class_id } });
}
export async function assignSubjectToTeacher(data: AssignSubjectToTeacherInput) {
  return prisma.subjects.update({ where: { id: data.subject_id }, data: { teacherId: data.teacher_id } });
}
export async function unassignSubjectFromClass(data: UnassignSubjectFromClassInput) {
  return prisma.subjects.update({ where: { id: data.subject_id }, data: { classId: undefined } });
}
export async function unassignSubjectFromTeacher(data: UnassignSubjectFromTeacherInput) {
  return prisma.subjects.update({ where: { id: data.subject_id }, data: { teacherId: undefined } });
}