/*
  Warnings:

  - You are about to drop the column `StartDate` on the `AcademicYears` table. All the data in the column will be lost.
  - You are about to drop the column `SubmissionInstructions` on the `Assignments` table. All the data in the column will be lost.
  - You are about to drop the column `MaximumGrade` on the `Exams` table. All the data in the column will be lost.
  - You are about to drop the column `CompletionStatus` on the `Lessons` table. All the data in the column will be lost.
  - You are about to drop the column `Strengths` on the `ProgressNotes` table. All the data in the column will be lost.
  - You are about to drop the column `Description` on the `Subjects` table. All the data in the column will be lost.
  - You are about to drop the column `StartDate` on the `Terms` table. All the data in the column will be lost.
  - Added the required column `startDate` to the `AcademicYears` table without a default value. This is not possible if the table is not empty.
  - Added the required column `submissionInstructions` to the `Assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maximumGrade` to the `Exams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `completionStatus` to the `Lessons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `strengths` to the `ProgressNotes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Terms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- AcademicYears
ALTER TABLE "AcademicYears"
RENAME COLUMN "StartDate" TO "startDate";


-- Assignments
ALTER TABLE "Assignments"
RENAME COLUMN "SubmissionInstructions" TO "submissionInstructions";


-- Exams
ALTER TABLE "Exams"
RENAME COLUMN "MaximumGrade" TO "maximumGrade";


-- Lessons
ALTER TABLE "Lessons"
RENAME COLUMN "CompletionStatus" TO "completionStatus";


-- ProgressNotes
ALTER TABLE "ProgressNotes"
RENAME COLUMN "Strengths" TO "strengths";


-- Subjects
ALTER TABLE "Subjects"
RENAME COLUMN "Description" TO "description";


-- Terms
ALTER TABLE "Terms"
RENAME COLUMN "StartDate" TO "startDate";