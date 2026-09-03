-- AlterTable Examination to track post-exam review release
ALTER TABLE "Examination" ADD COLUMN IF NOT EXISTS "resultsReleased" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Examination" ADD COLUMN IF NOT EXISTS "resultsReleasedAt" TIMESTAMP(3);

-- AlterTable ExamSession to persist computed scores
ALTER TABLE "ExamSession" ADD COLUMN IF NOT EXISTS "score" DOUBLE PRECISION;
ALTER TABLE "ExamSession" ADD COLUMN IF NOT EXISTS "totalMarks" DOUBLE PRECISION;
ALTER TABLE "ExamSession" ADD COLUMN IF NOT EXISTS "percentage" DOUBLE PRECISION;
