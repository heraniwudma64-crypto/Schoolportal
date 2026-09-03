-- Migration: exam delivery window + session tracking
-- Adds scheduled delivery window fields to Examination and
-- introduces the ExamSession model for timer-resume and single-device enforcement.

-- ── Examination: delivery window & delay ────────────────────────────────────
ALTER TABLE "Examination"
  ADD COLUMN IF NOT EXISTS "instructions"  TEXT,
  ADD COLUMN IF NOT EXISTS "windowStart"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "windowEnd"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "delayMinutes"  INTEGER NOT NULL DEFAULT 0;

-- ── ExamSessionStatus enum ───────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "ExamSessionStatus" AS ENUM (
    'ACTIVE',
    'INTERRUPTED',
    'AWAITING_RESUME',
    'COMPLETED',
    'TIMED_OUT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── ExamSession model ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ExamSession" (
  "id"                   TEXT NOT NULL,
  "examinationId"        TEXT NOT NULL,
  "studentId"            TEXT NOT NULL,
  "sessionToken"         TEXT NOT NULL,
  "status"               "ExamSessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "timeRemainingSeconds" INTEGER NOT NULL,
  "answersJson"          TEXT NOT NULL DEFAULT '{}',
  "deviceFingerprint"    TEXT,
  "startedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSavedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt"          TIMESTAMP(3),
  "resumeApprovedAt"     TIMESTAMP(3),
  "resumeApprovedById"   TEXT,

  CONSTRAINT "ExamSession_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "ExamSession_sessionToken_key"  UNIQUE ("sessionToken"),
  CONSTRAINT "ExamSession_examinationId_studentId_key" UNIQUE ("examinationId", "studentId"),
  CONSTRAINT "ExamSession_examinationId_fkey"
    FOREIGN KEY ("examinationId") REFERENCES "Examination"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ExamSession_status_idx"              ON "ExamSession"("status");
CREATE INDEX IF NOT EXISTS "ExamSession_examinationId_status_idx" ON "ExamSession"("examinationId", "status");
