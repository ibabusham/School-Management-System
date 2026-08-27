/*
  Warnings:

  - A unique constraint covering the columns `[assignmentID,studentId]` on the table `AssignmentSubmissions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AssignmentSubmissions_assignmentID_studentId_key" ON "AssignmentSubmissions"("assignmentID", "studentId");
