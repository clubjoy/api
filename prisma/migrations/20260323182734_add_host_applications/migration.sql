-- CreateEnum
CREATE TYPE "HostApplicationStatus" AS ENUM ('PENDING', 'CONTACTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "host_applications" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "companyName" TEXT,
    "postalCode" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT,
    "workshopsOffered" TEXT NOT NULL,
    "daysAndHours" TEXT NOT NULL,
    "status" "HostApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "rejectionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "host_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "host_applications_status_idx" ON "host_applications"("status");

-- CreateIndex
CREATE INDEX "host_applications_email_idx" ON "host_applications"("email");

-- CreateIndex
CREATE INDEX "host_applications_createdAt_idx" ON "host_applications"("createdAt");
