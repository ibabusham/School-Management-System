import { apiRequest } from "@/lib/api/client";
import type { AcademicYear } from "@/lib/api/academic-years";
import type { StudentSummary } from "@/lib/api/students";
import type { SubjectSummary } from "@/lib/api/subjects";
import type {
  LearningProgress,
  ProgressNote,
} from "@/lib/api/learning-progress";

export type AdminDashboard = {
  counts: {
    students: number;
    teachers: number;
    classes: number;
    subjects: number;
  };
  recentStudents: StudentSummary[];
  academicYears: AcademicYear[];
};

export async function fetchAdminDashboard() {
  return apiRequest<AdminDashboard>("/api/dashboard/admin");
}

export type TeacherDashboard = {
  counts: {
    subjects: number;
    exams: number;
    assignments: number;
  };
  subjects: SubjectSummary[];
  recentExams: { id: string; examName: string; examDate: string }[];
  recentAssignments: {
    id: string;
    assignmentTitle: string;
    assignmentDescription: string;
    dueDate: string;
    maximumGrade: number;
    subjectId: string;
  }[];
};

export async function fetchTeacherDashboard() {
  return apiRequest<TeacherDashboard>("/api/dashboard/teacher");
}

export type StudentDashboard = {
  learningProgress: LearningProgress;
  recentNotes: ProgressNote[];
};

export async function fetchStudentDashboard() {
  return apiRequest<StudentDashboard>("/api/dashboard/student");
}
