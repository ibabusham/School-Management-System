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
import {
  createTermSchema,
  updateTermSchema,
} from "@/app/api/terms/schemas";
import {
  bulkMarkExamSchema,
  createExamSchema,
  updateExamSchema,
} from "@/app/api/exams/schemas";
import { z } from "zod";
import { zodToOpenApiSchema } from "./zod-to-schema";

const roleSchema = z.enum(["ADMIN", "TEACHER", "STUDENT"]);
const genderSchema = z.enum(["MALE", "FEMALE"]);
const academicYearStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const academicYearSchema = z.object({
  id: z.string(),
  yearName: z.string(),
  startDate: z.string().datetime().or(z.string()),
  endDate: z.string().datetime().or(z.string()),
  status: academicYearStatusSchema,
});

export const safeUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  role: roleSchema,
  accountStatus: z.boolean(),
  createdAt: z.string().datetime().or(z.string()),
});

export const classPerformanceSchema = z.object({
  id: z.string(),
  classAvg: z.number().int(),
  highestGrade: z.number().int(),
  lowestGrade: z.number().int(),
  assignmentsCompleationRate: z.number().int(),
  attendenceRate: z.number().int(),
  studentRequiringSupport: z.number().int(),
  classStatus: z.enum(["ACTIVE", "INACTIVE"]),
  classId: z.string(),
});

export const teacherSchema = z.object({
  id: z.string(),
  name: z.string(),
  employId: z.number().int(),
  email: z.string().email(),
  phoneNumber: z.string(),
  specilization: z.string(),
  accountStatus: z.boolean(),
  user: safeUserSchema.optional(),
});

export const learningProgressSchema = z.object({
  id: z.string(),
  subjectsAverages: z.number().int(),
  overallAvreages: z.number().int(),
  attendencePercentage: z.number().int(),
  learningStatus: z.enum(["ACTIVE", "INACTIVE"]),
});

export const studentSummarySchema = z.object({
  id: z.string(),
  studentId: z.number().int(),
  firstName: z.string(),
  lastName: z.string(),
});

export const teacherSummarySchema = z.object({
  id: z.string(),
  employId: z.number().int(),
  name: z.string(),
  specilization: z.string(),
});

export const studentSchema = z.object({
  id: z.string(),
  studentId: z.number().int(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  accountStatus: z.boolean(),
  dateOfBirth: z.string().datetime().or(z.string()),
  phoneNumber: z.string().optional().nullable(),
  enrollmentDate: z.string().datetime().or(z.string()),
  learningProgress: learningProgressSchema.optional(),
  gender: genderSchema,
  user: safeUserSchema.optional(),
});

export const classSchema = z.object({
  id: z.string(),
  className: z.string(),
});

export const subjectSchema = z.object({
  id: z.string(),
  subjectName: z.string(),
  subjectCode: z.string(),
  description: z.string(),
  classId: z.string(),
  teacherId: z.string(),
  class: classSchema.optional(),
  teacher: teacherSchema.optional(),
});

export const subjectSummarySchema = z.object({
  id: z.string(),
  subjectName: z.string(),
  subjectCode: z.string(),
});

export const termSchema = z.object({
  id: z.string(),
  termName: z.string(),
  startDate: z.string().datetime().or(z.string()),
  endDate: z.string().datetime().or(z.string()),
  yearId: z.string(),
  year: academicYearSchema.optional(),
});

export const examSchema = z.object({
  id: z.string(),
  examName: z.string(),
  examDate: z.string().datetime().or(z.string()),
  maximumGrade: z.number().int(),
  subjectId: z.string(),
  subject: subjectSchema.optional(),
});

export const examSummarySchema = z.object({
  id: z.string(),
  examName: z.string(),
  examDate: z.string().datetime().or(z.string()),
});

export const takenSubmissionSummarySchema = z.object({
  id: z.string(),
  studentId: z.string(),
  examId: z.string(),
  score: z.number().int().nullable(),
  takenAt: z.string().datetime().or(z.string()),
  firstName: z.string(),
  lastName: z.string(),
});

export const markSubmissionSummarySchema = z.object({
  id: z.string(),
  studentId: z.string(),
  examId: z.string(),
  score: z.number().int().nullable(),
});

export const examSubmissionSchema = z.object({
  id: z.string(),
  examId: z.string(),
  studentId: z.string(),
  score: z.number().int().nullable(),
  takenAt: z.string().datetime().or(z.string()),
  student: studentSchema.optional(),
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
  CreateTermRequest: zodToOpenApiSchema(createTermSchema),
  UpdateTermRequest: zodToOpenApiSchema(updateTermSchema),
  CreateExamRequest: zodToOpenApiSchema(createExamSchema),
  UpdateExamRequest: zodToOpenApiSchema(updateExamSchema),
  BulkMarkExamRequest: zodToOpenApiSchema(bulkMarkExamSchema),
  Teacher: zodToOpenApiSchema(teacherSchema),
  Student: zodToOpenApiSchema(studentSchema),
  StudentSummary: zodToOpenApiSchema(studentSummarySchema),
  TeacherSummary: zodToOpenApiSchema(teacherSummarySchema),
  Class: zodToOpenApiSchema(classSchema),
  Subject: zodToOpenApiSchema(subjectSchema),
  SubjectSummary: zodToOpenApiSchema(subjectSummarySchema),
  Term: zodToOpenApiSchema(termSchema),
  Exam: zodToOpenApiSchema(examSchema),
  ExamSummary: zodToOpenApiSchema(examSummarySchema),
  TakenSubmissionSummary: zodToOpenApiSchema(takenSubmissionSummarySchema),
  MarkSubmissionSummary: zodToOpenApiSchema(markSubmissionSummarySchema),
  ExamSubmission: zodToOpenApiSchema(examSubmissionSchema),
  TeacherResponse: zodToOpenApiSchema(z.object({ teacher: teacherSchema })),
  StudentResponse: zodToOpenApiSchema(z.object({ student: studentSchema })),
  CreateStudentResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      student: studentSummarySchema,
    })
  ),
  DeleteStudentResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      student: studentSchema,
    })
  ),
  CreateTeacherResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      teacher: teacherSummarySchema,
    })
  ),
  DeleteTeacherResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      teacher: teacherSchema,
    })
  ),
  ClassResponse: zodToOpenApiSchema(z.object({ classData: classSchema })),
  DeleteClassResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      classData: classSchema,
    })
  ),
  ClassPerformance: zodToOpenApiSchema(classPerformanceSchema),
  ClassPerformanceResponse: zodToOpenApiSchema(
    z.object({ performance: classPerformanceSchema })
  ),
  SubjectResponse: zodToOpenApiSchema(z.object({ subject: subjectSchema })),
  CreateSubjectResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      subject: subjectSummarySchema,
    })
  ),
  UpdateSubjectResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      subject: subjectSchema,
    })
  ),
  DeleteSubjectResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      subject: subjectSchema,
    })
  ),
  TermResponse: zodToOpenApiSchema(z.object({ term: termSchema })),
  CreateTermResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      term: termSchema,
    })
  ),
  UpdateTermResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      term: termSchema,
    })
  ),
  DeleteTermResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      term: termSchema,
    })
  ),
  ExamResponse: zodToOpenApiSchema(z.object({ exam: examSchema })),
  CreateExamResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      exam: examSummarySchema,
    })
  ),
  UpdateExamResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      exam: examSchema,
    })
  ),
  DeleteExamResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      exam: examSchema,
    })
  ),
  MarkExamResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      data: z.array(markSubmissionSummarySchema),
      pagination: paginationSchema,
    })
  ),
  AssignStudentsResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      classId: z.string(),
      className: z.string(),
      students: z.array(studentSummarySchema),
      assignedCount: z.number().int(),
    })
  ),
  UnassignStudentResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      student: studentSchema,
    })
  ),
  TeacherListResponse: zodToOpenApiSchema(
    z.object({ data: z.array(teacherSummarySchema), pagination: paginationSchema })
  ),
  StudentListResponse: zodToOpenApiSchema(
    z.object({ data: z.array(studentSummarySchema), pagination: paginationSchema })
  ),
  ClassListResponse: zodToOpenApiSchema(
    z.object({ data: z.array(classSchema), pagination: paginationSchema })
  ),
  SubjectListResponse: zodToOpenApiSchema(
    z.object({ data: z.array(subjectSummarySchema), pagination: paginationSchema })
  ),
  TermListResponse: zodToOpenApiSchema(
    z.object({ data: z.array(termSchema), pagination: paginationSchema })
  ),
  ExamListResponse: zodToOpenApiSchema(
    z.object({ data: z.array(examSummarySchema), pagination: paginationSchema })
  ),
  ExamSubmissionListResponse: zodToOpenApiSchema(
    z.object({ data: z.array(takenSubmissionSummarySchema), pagination: paginationSchema })
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
  CreateAcademicYearResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      data: academicYearSchema,
    })
  ),
  UpdateAcademicYearResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      data: academicYearSchema,
    })
  ),
  DeleteAcademicYearResponse: zodToOpenApiSchema(
    z.object({
      message: z.string(),
      data: academicYearSchema,
    })
  ),
  AcademicYearListResponse: zodToOpenApiSchema(
    z.object({ data: z.array(academicYearSchema), pagination: paginationSchema })
  ),
  AcademicYearResponse: zodToOpenApiSchema(
    z.object({ data: academicYearSchema })
  ),
  ErrorResponse: zodToOpenApiSchema(z.object({ error: z.string() })),
};
