-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "Student" (
    "user_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "account_status" BOOLEAN NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "phonenumber" TEXT NOT NULL,
    "enrollment_date" TIMESTAMP(3) NOT NULL,
    "learning_progress_id" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("user_id")
);
