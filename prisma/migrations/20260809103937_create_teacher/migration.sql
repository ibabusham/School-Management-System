-- CreateTable
CREATE TABLE "Teacher" (
    "user_id" TEXT NOT NULL,
    "employ_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "phonenumber" TEXT NOT NULL,
    "specilization" TEXT NOT NULL,
    "account_status" BOOLEAN NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("user_id")
);
