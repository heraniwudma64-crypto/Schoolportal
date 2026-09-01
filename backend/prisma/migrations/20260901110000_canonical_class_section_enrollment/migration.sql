-- Canonical class assignment is StudentEnrollment -> ClassSection.
-- Backfill only unambiguous legacy profile assignments: a section must already
-- belong to one academic year and one grade. Ambiguous historical sections are
-- deliberately left untouched so no student is silently assigned incorrectly.
INSERT INTO "StudentEnrollment" (
  "id", "studentId", "academicYearId", "gradeLevelId", "classSectionId",
  "enrollmentDate", "status", "createdAt", "updatedAt"
)
SELECT
  'legacy-enrollment-' || s."id" || '-' || cs."academicYearId",
  s."id",
  cs."academicYearId",
  cs."gradeLevelId",
  cs."id",
  NOW(),
  'ACTIVE',
  NOW(),
  NOW()
FROM "Student" s
JOIN "ClassSection" cs ON cs."id" = s."classSectionId"
WHERE cs."academicYearId" IS NOT NULL
  AND cs."gradeLevelId" IS NOT NULL
ON CONFLICT ("studentId", "academicYearId") DO NOTHING;

-- Existing data has no NULL enrollment section IDs; make that invariant
-- database-enforced so new enrollment records cannot become fragmented.
ALTER TABLE "StudentEnrollment"
  ALTER COLUMN "classSectionId" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ClassSection_academicYearId_gradeLevelId_name_key"
  ON "ClassSection" ("academicYearId", "gradeLevelId", "name");

CREATE INDEX IF NOT EXISTS "StudentEnrollment_academicYearId_gradeLevelId_classSectionId_status_idx"
  ON "StudentEnrollment" ("academicYearId", "gradeLevelId", "classSectionId", "status");
