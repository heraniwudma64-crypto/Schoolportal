-- Migration: Add ClassRosterReview model and RosterReviewStatus Enum

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RosterReviewStatus') THEN
    CREATE TYPE "RosterReviewStatus" AS ENUM ('DRAFT', 'SUBMITTED_TO_ADMIN', 'REJECTED', 'APPROVED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "class_roster_reviews" (
  "id" TEXT NOT NULL,
  "classSectionId" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "homeroomTeacherId" TEXT,
  "status" "RosterReviewStatus" NOT NULL DEFAULT 'DRAFT',
  "submittedAt" TIMESTAMP(3),
  "submittedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  "rejectionReason" TEXT,
  "conductData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "class_roster_reviews_pkey" PRIMARY KEY ("id")
);

-- Ensure homeroomTeacherId column exists
ALTER TABLE "class_roster_reviews" 
  ADD COLUMN IF NOT EXISTS "homeroomTeacherId" TEXT;

-- Foreign Keys
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_roster_reviews_classSectionId_fkey') THEN
    ALTER TABLE "class_roster_reviews" ADD CONSTRAINT "class_roster_reviews_classSectionId_fkey" 
      FOREIGN KEY ("classSectionId") REFERENCES "ClassSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_roster_reviews_academicYearId_fkey') THEN
    ALTER TABLE "class_roster_reviews" ADD CONSTRAINT "class_roster_reviews_academicYearId_fkey" 
      FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_roster_reviews_homeroomTeacherId_fkey') THEN
    ALTER TABLE "class_roster_reviews" ADD CONSTRAINT "class_roster_reviews_homeroomTeacherId_fkey" 
      FOREIGN KEY ("homeroomTeacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_roster_reviews_submittedById_fkey') THEN
    ALTER TABLE "class_roster_reviews" ADD CONSTRAINT "class_roster_reviews_submittedById_fkey" 
      FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_roster_reviews_reviewedById_fkey') THEN
    ALTER TABLE "class_roster_reviews" ADD CONSTRAINT "class_roster_reviews_reviewedById_fkey" 
      FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Unique Constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'class_roster_reviews_classSectionId_academicYearId_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'class_roster_reviews_classSectionId_academicYearId_key'
  ) THEN
    ALTER TABLE "class_roster_reviews" ADD CONSTRAINT "class_roster_reviews_classSectionId_academicYearId_key" 
      UNIQUE ("classSectionId", "academicYearId");
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "class_roster_reviews_academicYearId_status_idx" ON "class_roster_reviews"("academicYearId", "status");
CREATE INDEX IF NOT EXISTS "class_roster_reviews_classSectionId_idx" ON "class_roster_reviews"("classSectionId");
CREATE INDEX IF NOT EXISTS "class_roster_reviews_homeroomTeacherId_idx" ON "class_roster_reviews"("homeroomTeacherId");
