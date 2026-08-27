-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "RefreshToken" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "Classes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "Subjects" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "AcademicYears" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "Terms" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "Assignments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "Lessons" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "Exams" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "LearningProgresses" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "ProgressNotes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "ClassesPerformence" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "Attendences" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "ExamSubmissions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
