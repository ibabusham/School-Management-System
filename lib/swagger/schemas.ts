import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  resetPasswordSchema,
} from "@/app/api/auth/authSchemas/schemas";
import {
  assignStudentsSchema,
  createClassSchema,
  updateClassSchema,
} from "@/app/api/classes/schemas";
import {
  createStudentSchema,
  updateStudentSchema,
} from "@/app/api/students/schemas";
import {
  createTeacherSchema,
  updateTeacherSchema,
} from "@/app/api/teachers/schemas";
import {
  createAcademicYearSchema,
  updateAcademicYearSchema,
} from "@/app/api/academicYears/schemas";
import {
  assignSubjectToClassSchema,
  assignSubjectToTeacherSchema,
  createSubjectSchema,
  updateSubjectSchema,
} from "@/app/api/subjects/schemas";
import { z } from "zod";
import { zodToOpenApiSchema } from "./zod-to-schema";

const roleSchema = z.enum(["ADMIN", "TEACHER", "STUDENT"]);
const genderSchema = z.enum(["MALE", "FEMALE"]);
const academicYearStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const academicYearSchema = z.object({
  id: z.string(),
  year_name: z.string(),
  Start_date: z.string().datetime().or(z.string()),
  end_date: z.string().datetime().or(z.string()),
  status: academicYearStatusSchema,
});

export const safeUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  role: roleSchema,
  account_status: z.boolean(),
  createdAt: z.string().datetime().or(z.string()),
});

export const teacherSchema = z.object({
  id: z.string(),
  name: z.string(),
  employ_id: z.number().int(),
  email: z.string().email(),
  phonenumber: z.string(),
  specilization: z.string(),
  account_status: z.boolean(),
  user: safeUserSchema.optional(),
});

export const studentSchema = z.object({
  id: z.string(),
  student_id: z.number().int(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  account_status: z.boolean(),
  date_of_birth: z.string().datetime().or(z.string()),
  phonenumber: z.string(),
  enrollment_date: z.string().datetime().or(z.string()),
  learning_progress_id: z.string(),
  gender: genderSchema,
  user: safeUserSchema.optional(),
});

export const classSchema = z.object({
  id: z.string(),
  class_name: z.string(),
});

export const subjectSchema = z.object({
  id: z.string(),
  subject_name: z.string(),
  subject_code: z.string(),
  Description: z.string(),
  classId: z.string(),
  teacherId: z.string(),
  class: classSchema.optional(),
  teacher: teacherSchema.optional(),
});

export const paginationSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

export const swaggerComponentSchemas = {
  LoginRequest: zodToOpenApiSchema(loginSchema),
  RefreshTokenRequest: zodToOpenApiSchema(refreshTokenSchema),
  CreateStudentRequest: zodToOpenApiSchema(createStudentSchema),
  UpdateStudentRequest: zodToOpenApiSchema(updateStudentSchema),
  CreateTeacherRequest: zodToOpenApiSchema(createTeacherSchema),
  UpdateTeacherRequest: zodToOpenApiSchema(updateTeacherSchema),
  CreateClassRequest: zodToOpenApiSchema(createClassSchema),
  UpdateClassRequest: zodToOpenApiSchema(updateClassSchema),
  AssignStudentsRequest: zodToOpenApiSchema(assignStudentsSchema),
  CreateSubjectRequest: zodToOpenApiSchema(createSubjectSchema),
  UpdateSubjectRequest: zodToOpenApiSchema(updateSubjectSchema),
  AssignSubjectToClassRequest: zodToOpenApiSchema(assignSubjectToClassSchema),
  AssignSubjectToTeacherRequest: zodToOpenApiSchema(assignSubjectToTeacherSchema),
  Teacher: zodToOpenApiSchema(teacherSchema),
  Student: zodToOpenApiSchema(studentSchema),
  Class: zodToOpenApiSchema(classSchema),
  Subject: zodToOpenApiSchema(subjectSchema),
  TeacherResponse: zodToOpenApiSchema(z.object({ teacher: teacherSchema })),
  StudentResponse: zodToOpenApiSchema(z.object({ student: studentSchema })),
  ClassResponse: zodToOpenApiSchema(z.object({ classData: classSchema })),
  SubjectResponse: zodToOpenApiSchema(z.object({ subject: subjectSchema })),
  AssignStudentsResponse: zodToOpenApiSchema(
    z.object({
      students: z.array(studentSchema),
      assignedCount: z.number().int(),
    })
  ),
  TeacherListResponse: zodToOpenApiSchema(
    z.object({ data: z.array(teacherSchema), pagination: paginationSchema })
  ),
  StudentListResponse: zodToOpenApiSchema(
    z.object({ data: z.array(studentSchema), pagination: paginationSchema })
  ),
  ClassListResponse: zodToOpenApiSchema(
    z.object({ data: z.array(classSchema), pagination: paginationSchema })
  ),
  SubjectListResponse: zodToOpenApiSchema(
    z.object({ data: z.array(subjectSchema), pagination: paginationSchema })
  ),
  LoginResponse: zodToOpenApiSchema(
    z.object({
      accessToken: z.string(),
      refreshToken: z.string(),
      user: safeUserSchema,
    })
  ),
  RefreshTokenResponse: zodToOpenApiSchema(
    z.object({
      accessToken: z.string(),
      refreshToken: z.string(),
    })
  ),
  LogoutRequest: zodToOpenApiSchema(logoutSchema),
  LogoutResponse: zodToOpenApiSchema(
    z.object({ message: z.string() })
  ),
  ChangePasswordRequest: zodToOpenApiSchema(changePasswordSchema),
  ChangePasswordResponse: zodToOpenApiSchema(
    z.object({ message: z.string() })
  ),
  ForgotPasswordRequest: zodToOpenApiSchema(forgotPasswordSchema),
  ForgotPasswordResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      token: z.string().optional(),
    })
  ),
  ResetPasswordRequest: zodToOpenApiSchema(resetPasswordSchema),
  ResetPasswordResponse: zodToOpenApiSchema(
    z.object({ message: z.string() })
  ),
  CreateAcademicYearRequest: zodToOpenApiSchema(createAcademicYearSchema),
  UpdateAcademicYearRequest: zodToOpenApiSchema(updateAcademicYearSchema),
  AcademicYear: zodToOpenApiSchema(academicYearSchema),
  AcademicYearListResponse: zodToOpenApiSchema(
    z.object({ data: z.array(academicYearSchema), pagination: paginationSchema })
  ),
  AcademicYearResponse: zodToOpenApiSchema(
    z.object({ data: academicYearSchema })
  ),
  ErrorResponse: zodToOpenApiSchema(z.object({ error: z.string() })),
};
