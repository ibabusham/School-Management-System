/*
  Warnings:

  - A unique constraint covering the columns `[learning_progress_id]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "iscompleate" AS ENUM ('COMPLEATED', 'INCOMPLEATE');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "classId" TEXT;

-- CreateTable
CREATE TABLE "Classes" (
    "id" TEXT NOT NULL,
    "class_name" TEXT NOT NULL,

    CONSTRAINT "Classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subjects" (
    "id" TEXT NOT NULL,
    "subject_name" TEXT NOT NULL,
    "subject_code" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "Subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Academic_Years" (
    "id" TEXT NOT NULL,
    "year_name" TEXT NOT NULL,
    "Start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL,

    CONSTRAINT "Academic_Years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Terms" (
    "id" TEXT NOT NULL,
    "term_name" TEXT NOT NULL,
    "Start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "yearId" TEXT NOT NULL,

    CONSTRAINT "Terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class_Academic_year" (
    "classId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,

    CONSTRAINT "Class_Academic_year_pkey" PRIMARY KEY ("classId","yearId")
);

-- CreateTable
CREATE TABLE "Assignments" (
    "id" TEXT NOT NULL,
    "assignment_title" TEXT NOT NULL,
    "assignment_description" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "maximum_grade" INTEGER NOT NULL,
    "attachment" TEXT NOT NULL,
    "Submission_instructions" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "Assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lessons" (
    "id" TEXT NOT NULL,
    "lesson_title" TEXT NOT NULL,
    "lesson_description" TEXT NOT NULL,
    "lesson_date" TIMESTAMP(3) NOT NULL,
    "learning_objectinve" TEXT NOT NULL,
    "learning_material" TEXT NOT NULL,
    "Completion_status" "iscompleate" NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "Lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exams" (
    "id" TEXT NOT NULL,
    "exam_name" TEXT NOT NULL,
    "exam_date" TIMESTAMP(3) NOT NULL,
    "Maximum_grade" INTEGER NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "Exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Learning_progresses" (
    "id" TEXT NOT NULL,
    "subjects_averages" INTEGER NOT NULL,
    "overall_avreages" INTEGER NOT NULL,
    "compleated_assignments" TEXT NOT NULL,
    "missing_assignements" TEXT NOT NULL,
    "attendence_percentage" INTEGER NOT NULL,
    "learning_status" "Status" NOT NULL,

    CONSTRAINT "Learning_progresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progress_notes" (
    "id" TEXT NOT NULL,
    "note_date" TIMESTAMP(3) NOT NULL,
    "note_observation" TEXT NOT NULL,
    "Strengths" TEXT NOT NULL,
    "areas_for_improvement" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "learningProgressId" TEXT NOT NULL,

    CONSTRAINT "Progress_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classes_performence" (
    "id" TEXT NOT NULL,
    "class_avg" INTEGER NOT NULL,
    "highest_grade" INTEGER NOT NULL,
    "lowest_grade" INTEGER NOT NULL,
    "assignments_compleation_rate" INTEGER NOT NULL,
    "attendence_rate" INTEGER NOT NULL,
    "student_requiring_support" INTEGER NOT NULL,
    "class_status" "Status" NOT NULL,
    "classId" TEXT NOT NULL,

    CONSTRAINT "Classes_performence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendences" (
    "id" TEXT NOT NULL,
    "attendance_date" TIMESTAMP(3) NOT NULL,
    "attendance_status" TEXT NOT NULL,
    "attendance_percentage" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "Attendences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Classes_performence_classId_key" ON "Classes_performence"("classId");

-- Existing students may share the same learning_progress_id (e.g. LP-001).
-- Give each student a unique progress id and create matching Learning_progresses rows
-- before the unique index + FK are added.
UPDATE "Student"
SET "learning_progress_id" = 'lp_' || "id"
WHERE "learning_progress_id" IS NOT NULL;

INSERT INTO "Learning_progresses" (
    "id",
    "subjects_averages",
    "overall_avreages",
    "compleated_assignments",
    "missing_assignements",
    "attendence_percentage",
    "learning_status"
)
SELECT
    s."learning_progress_id",
    0,
    0,
    '',
    '',
    0,
    'ACTIVE'::"Status"
FROM "Student" s
WHERE NOT EXISTS (
    SELECT 1
    FROM "Learning_progresses" lp
    WHERE lp."id" = s."learning_progress_id"
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_learning_progress_id_key" ON "Student"("learning_progress_id");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_learning_progress_id_fkey" FOREIGN KEY ("learning_progress_id") REFERENCES "Learning_progresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subjects" ADD CONSTRAINT "Subjects_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subjects" ADD CONSTRAINT "Subjects_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Terms" ADD CONSTRAINT "Terms_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "Academic_Years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class_Academic_year" ADD CONSTRAINT "Class_Academic_year_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class_Academic_year" ADD CONSTRAINT "Class_Academic_year_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "Academic_Years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignments" ADD CONSTRAINT "Assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lessons" ADD CONSTRAINT "Lessons_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exams" ADD CONSTRAINT "Exams_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress_notes" ADD CONSTRAINT "Progress_notes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress_notes" ADD CONSTRAINT "Progress_notes_learningProgressId_fkey" FOREIGN KEY ("learningProgressId") REFERENCES "Learning_progresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classes_performence" ADD CONSTRAINT "Classes_performence_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendences" ADD CONSTRAINT "Attendences_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendences" ADD CONSTRAINT "Attendences_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
