import { Role } from "@/prisma/generated/client";
import type { JwtPayload } from "./jwt";


export function isAdmin(payload: JwtPayload) {
  return payload.role === Role.ADMIN;
}


export function isTeacher(payload: JwtPayload) {
  return payload.role === Role.TEACHER;
}


export function isStudent(payload: JwtPayload) {
  return payload.role === Role.STUDENT;
}
