-- CreateIndex
CREATE INDEX IF NOT EXISTS "Assignment_teacherId_idx" ON "Assignment"("teacherId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Assignment_classSectionId_idx" ON "Assignment"("classSectionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClassSection_teacherId_idx" ON "ClassSection"("teacherId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Examination_teacherId_status_idx" ON "Examination"("teacherId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Examination_classSectionId_idx" ON "Examination"("classSectionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notice_status_publishedAt_idx" ON "Notice"("status", "publishedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SectionSubjectTeacher_teacherId_academicYearId_idx" ON "SectionSubjectTeacher"("teacherId", "academicYearId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Student_classSectionId_status_idx" ON "Student"("classSectionId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Student_parentId_idx" ON "Student"("parentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SubjectResult_academicYearId_classSectionId_status_idx" ON "SubjectResult"("academicYearId", "classSectionId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_isDeleted_role_isActive_idx" ON "User"("isDeleted", "role", "isActive");
