ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "class_section_id" TEXT;

ALTER TABLE "materials"
  ADD CONSTRAINT "materials_class_section_id_fkey"
  FOREIGN KEY ("class_section_id") REFERENCES "ClassSection"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "materials_class_section_id_idx"
  ON "materials"("class_section_id");
