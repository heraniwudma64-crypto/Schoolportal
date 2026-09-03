-- Migration: Add Educational Videos Table and VideoStatus Enum
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VideoStatus') THEN
    CREATE TYPE "VideoStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "educational_videos" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "youtubeUrl" TEXT NOT NULL,
  "youtubeVideoId" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "subjectId" TEXT NOT NULL,
  "classSectionId" TEXT,
  "teacherId" TEXT NOT NULL,
  "status" "VideoStatus" NOT NULL DEFAULT 'DRAFT',
  "rejectionReason" TEXT,
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "educational_videos_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'educational_videos_subjectId_fkey') THEN
    ALTER TABLE "educational_videos" ADD CONSTRAINT "educational_videos_subjectId_fkey" 
      FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'educational_videos_classSectionId_fkey') THEN
    ALTER TABLE "educational_videos" ADD CONSTRAINT "educational_videos_classSectionId_fkey" 
      FOREIGN KEY ("classSectionId") REFERENCES "ClassSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'educational_videos_teacherId_fkey') THEN
    ALTER TABLE "educational_videos" ADD CONSTRAINT "educational_videos_teacherId_fkey" 
      FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "educational_videos_status_idx" ON "educational_videos"("status");
CREATE INDEX IF NOT EXISTS "educational_videos_classSectionId_status_idx" ON "educational_videos"("classSectionId", "status");
CREATE INDEX IF NOT EXISTS "educational_videos_teacherId_idx" ON "educational_videos"("teacherId");
CREATE INDEX IF NOT EXISTS "educational_videos_subjectId_idx" ON "educational_videos"("subjectId");
