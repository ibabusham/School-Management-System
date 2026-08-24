/*
  Warnings:

  - You are about to drop the column `compleated_assignments` on the `Learning_progresses` table. All the data in the column will be lost.
  - You are about to drop the column `missing_assignements` on the `Learning_progresses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Learning_progresses" DROP COLUMN "compleated_assignments",
DROP COLUMN "missing_assignements";

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "phonenumber" DROP NOT NULL;
