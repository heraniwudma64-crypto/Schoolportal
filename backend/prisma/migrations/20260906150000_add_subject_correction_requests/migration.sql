-- Migration: Add RETURNED_FOR_CORRECTION to ResultStatus, add CorrectionRequestStatus enum, and create subject_correction_requests table

-- 1. Add RETURNED_FOR_CORRECTION to ResultStatus enum
ALTER TYPE "ResultStatus" ADD VALUE IF NOT EXISTS 'RETURNED_FOR_CORRECTION';

-- 2. Create CorrectionRequestStatus enum if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CorrectionRequestStatus') THEN
    CREATE TYPE "CorrectionRequestStatus" AS ENUM ('PENDING', 'RESOLVED');
  END IF;
END $$;

-- 3. Create subject_correction_requests table
CREATE TABLE IF NOT EXISTS "subject_correction_requests" (
  "id" TEXT NOT NULL,
  "classSectionId" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "term" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "reason" TEXT,
  "status" "CorrectionRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),

  CONSTRAINT "subject_correction_requests_pkey" PRIMARY KEY ("id")
);

-- 4. Foreign Keys
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subject_correction_requests_classSectionId_fkey') THEN
    ALTER TABLE "subject_correction_requests" ADD CONSTRAINT "subject_correction_requests_classSectionId_fkey" 
      FOREIGN KEY ("classSectionId") REFERENCES "ClassSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subject_correction_requests_academicYearId_fkey') THEN
    ALTER TABLE "subject_correction_requests" ADD CONSTRAINT "subject_correction_requests_academicYearId_fkey" 
      FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subject_correction_requests_subjectId_fkey') THEN
    ALTER TABLE "subject_correction_requests" ADD CONSTRAINT "subject_correction_requests_subjectId_fkey" 
      FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subject_correction_requests_requestedById_fkey') THEN
    ALTER TABLE "subject_correction_requests" ADD CONSTRAINT "subject_correction_requests_requestedById_fkey" 
      FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS "subject_correction_requests_classSectionId_academicYearId_s_idx" 
  ON "subject_correction_requests"("classSectionId", "academicYearId", "subjectId", "term", "status");
