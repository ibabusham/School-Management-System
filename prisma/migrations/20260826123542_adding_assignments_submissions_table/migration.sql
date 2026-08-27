-- CreateTable
CREATE TABLE "AssignmentSubmissions" (
    "id" TEXT NOT NULL,
    "assignmentID" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" INTEGER,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentSubmissions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AssignmentSubmissions" ADD CONSTRAINT "AssignmentSubmissions_assignmentID_fkey" FOREIGN KEY ("assignmentID") REFERENCES "Assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmissions" ADD CONSTRAINT "AssignmentSubmissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
