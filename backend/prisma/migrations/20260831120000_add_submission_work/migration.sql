-- Preserve the existing Submission relation and add only the metadata required
-- to retain a student's submitted work.
ALTER TABLE "Submission"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "content" TEXT,
  ADD COLUMN "fileUrl" TEXT,
  ADD COLUMN "fileName" TEXT,
  ADD COLUMN "fileType" TEXT,
  ADD COLUMN "fileSize" INTEGER;
