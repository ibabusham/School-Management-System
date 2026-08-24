-- Rename columns instead of dropping and recreating them

-- Assignments
ALTER TABLE "Assignments"
RENAME COLUMN "Submission_instructions" TO "SubmissionInstructions";

ALTER TABLE "Assignments"
RENAME COLUMN "assignment_description" TO "assignmentDescription";

ALTER TABLE "Assignments"
RENAME COLUMN "assignment_title" TO "assignmentTitle";

ALTER TABLE "Assignments"
RENAME COLUMN "due_date" TO "dueDate";

ALTER TABLE "Assignments"
RENAME COLUMN "maximum_grade" TO "maximumGrade";


-- Attendences
ALTER TABLE "Attendences"
RENAME COLUMN "attendance_date" TO "attendanceDate";

ALTER TABLE "Attendences"
RENAME COLUMN "attendance_percentage" TO "attendancePercentage";

ALTER TABLE "Attendences"
RENAME COLUMN "attendance_status" TO "attendanceStatus";


-- Classes
ALTER TABLE "Classes"
RENAME COLUMN "class_name" TO "className";


-- Exams
ALTER TABLE "Exams"
RENAME COLUMN "Maximum_grade" TO "MaximumGrade";

ALTER TABLE "Exams"
RENAME COLUMN "exam_date" TO "examDate";

ALTER TABLE "Exams"
RENAME COLUMN "exam_name" TO "examName";


-- Lessons
ALTER TABLE "Lessons"
RENAME COLUMN "Completion_status" TO "CompletionStatus";

ALTER TABLE "Lessons"
RENAME COLUMN "learning_material" TO "learningMaterial";

ALTER TABLE "Lessons"
RENAME COLUMN "learning_objectinve" TO "learningObjectinve";

ALTER TABLE "Lessons"
RENAME COLUMN "lesson_date" TO "lessonDate";

ALTER TABLE "Lessons"
RENAME COLUMN "lesson_description" TO "lessonDescription";

ALTER TABLE "Lessons"
RENAME COLUMN "lesson_title" TO "lessonTitle";


-- Student
ALTER TABLE "Student"
RENAME COLUMN "account_status" TO "accountStatus";

ALTER TABLE "Student"
RENAME COLUMN "date_of_birth" TO "dateOfBirth";

ALTER TABLE "Student"
RENAME COLUMN "enrollment_date" TO "enrollmentDate";

ALTER TABLE "Student"
RENAME COLUMN "first_name" TO "firstName";

ALTER TABLE "Student"
RENAME COLUMN "last_name" TO "lastName";

ALTER TABLE "Student"
RENAME COLUMN "learning_progress_id" TO "learningProgressId";

ALTER TABLE "Student"
RENAME COLUMN "phonenumber" TO "phoneNumber";

ALTER TABLE "Student"
RENAME COLUMN "student_id" TO "studentId";


-- Subjects
ALTER TABLE "Subjects"
RENAME COLUMN "subject_code" TO "subjectCode";

ALTER TABLE "Subjects"
RENAME COLUMN "subject_name" TO "subjectName";


-- Teacher
ALTER TABLE "Teacher"
RENAME COLUMN "account_status" TO "accountStatus";

ALTER TABLE "Teacher"
RENAME COLUMN "employ_id" TO "employId";

ALTER TABLE "Teacher"
RENAME COLUMN "phonenumber" TO "phoneNumber";


-- Terms
ALTER TABLE "Terms"
RENAME COLUMN "Start_date" TO "StartDate";

ALTER TABLE "Terms"
RENAME COLUMN "end_date" TO "endDate";

ALTER TABLE "Terms"
RENAME COLUMN "term_name" TO "termName";


-- User
ALTER TABLE "User"
RENAME COLUMN "account_status" TO "accountStatus";


-- Rename tables instead of dropping and recreating them

ALTER TABLE "Academic_Years"
RENAME TO "AcademicYears";

ALTER TABLE "Class_Academic_year"
RENAME TO "ClassAcademicYear";

ALTER TABLE "Classes_performence"
RENAME TO "ClassesPerformence";

ALTER TABLE "Exam_submissions"
RENAME TO "ExamSubmissions";

ALTER TABLE "Learning_progresses"
RENAME TO "LearningProgresses";

ALTER TABLE "Progress_notes"
RENAME TO "ProgressNotes";


-- Column renames on tables that were renamed above

ALTER TABLE "AcademicYears"
RENAME COLUMN "year_name" TO "yearName";

ALTER TABLE "AcademicYears"
RENAME COLUMN "Start_date" TO "StartDate";

ALTER TABLE "AcademicYears"
RENAME COLUMN "end_date" TO "endDate";

ALTER TABLE "LearningProgresses"
RENAME COLUMN "subjects_averages" TO "subjectsAverages";

ALTER TABLE "LearningProgresses"
RENAME COLUMN "overall_avreages" TO "overallAvreages";

ALTER TABLE "LearningProgresses"
RENAME COLUMN "attendence_percentage" TO "attendencePercentage";

ALTER TABLE "LearningProgresses"
RENAME COLUMN "learning_status" TO "learningStatus";

ALTER TABLE "ProgressNotes"
RENAME COLUMN "note_date" TO "noteDate";

ALTER TABLE "ProgressNotes"
RENAME COLUMN "note_observation" TO "noteObservation";

ALTER TABLE "ProgressNotes"
RENAME COLUMN "areas_for_improvement" TO "areasForImprovement";

ALTER TABLE "ClassesPerformence"
RENAME COLUMN "class_avg" TO "classAvg";

ALTER TABLE "ClassesPerformence"
RENAME COLUMN "highest_grade" TO "highestGrade";

ALTER TABLE "ClassesPerformence"
RENAME COLUMN "lowest_grade" TO "lowestGrade";

ALTER TABLE "ClassesPerformence"
RENAME COLUMN "assignments_compleation_rate" TO "assignmentsCompleationRate";

ALTER TABLE "ClassesPerformence"
RENAME COLUMN "attendence_rate" TO "attendenceRate";

ALTER TABLE "ClassesPerformence"
RENAME COLUMN "student_requiring_support" TO "studentRequiringSupport";

ALTER TABLE "ClassesPerformence"
RENAME COLUMN "class_status" TO "classStatus";


-- Rename indexes (constraints already exist from prior migrations)

ALTER INDEX "Student_student_id_key"
RENAME TO "Student_studentId_key";

ALTER INDEX "Student_learning_progress_id_key"
RENAME TO "Student_learningProgressId_key";

ALTER INDEX "Teacher_employ_id_key"
RENAME TO "Teacher_employId_key";

ALTER INDEX "Classes_performence_classId_key"
RENAME TO "ClassesPerformence_classId_key";

ALTER INDEX "Exam_submissions_examId_studentId_key"
RENAME TO "ExamSubmissions_examId_studentId_key";

ALTER INDEX "Academic_Years_pkey"
RENAME TO "AcademicYears_pkey";

ALTER INDEX "Class_Academic_year_pkey"
RENAME TO "ClassAcademicYear_pkey";

ALTER INDEX "Classes_performence_pkey"
RENAME TO "ClassesPerformence_pkey";

ALTER INDEX "Exam_submissions_pkey"
RENAME TO "ExamSubmissions_pkey";

ALTER INDEX "Learning_progresses_pkey"
RENAME TO "LearningProgresses_pkey";

ALTER INDEX "Progress_notes_pkey"
RENAME TO "ProgressNotes_pkey";


-- Rename foreign keys to match Prisma's expected constraint names

ALTER TABLE "Student"
RENAME CONSTRAINT "Student_learning_progress_id_fkey" TO "Student_learningProgressId_fkey";

ALTER TABLE "ClassAcademicYear"
RENAME CONSTRAINT "Class_Academic_year_classId_fkey" TO "ClassAcademicYear_classId_fkey";

ALTER TABLE "ClassAcademicYear"
RENAME CONSTRAINT "Class_Academic_year_yearId_fkey" TO "ClassAcademicYear_yearId_fkey";

ALTER TABLE "ProgressNotes"
RENAME CONSTRAINT "Progress_notes_teacherId_fkey" TO "ProgressNotes_teacherId_fkey";

ALTER TABLE "ProgressNotes"
RENAME CONSTRAINT "Progress_notes_learningProgressId_fkey" TO "ProgressNotes_learningProgressId_fkey";

ALTER TABLE "ClassesPerformence"
RENAME CONSTRAINT "Classes_performence_classId_fkey" TO "ClassesPerformence_classId_fkey";

ALTER TABLE "ExamSubmissions"
RENAME CONSTRAINT "Exam_submissions_examId_fkey" TO "ExamSubmissions_examId_fkey";

ALTER TABLE "ExamSubmissions"
RENAME CONSTRAINT "Exam_submissions_studentId_fkey" TO "ExamSubmissions_studentId_fkey";
