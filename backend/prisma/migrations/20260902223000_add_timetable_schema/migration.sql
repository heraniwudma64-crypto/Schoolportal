-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "SchedulePeriod" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isBreak" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSchedule" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classSectionId" TEXT NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleEntry" (
    "id" TEXT NOT NULL,
    "classScheduleId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "periodId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "roomOverride" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchedulePeriod_academicYearId_isActive_idx" ON "SchedulePeriod"("academicYearId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SchedulePeriod_academicYearId_periodNumber_key" ON "SchedulePeriod"("academicYearId", "periodNumber");

-- CreateIndex
CREATE INDEX "ClassSchedule_academicYearId_status_idx" ON "ClassSchedule"("academicYearId", "status");

-- CreateIndex
CREATE INDEX "ClassSchedule_classSectionId_idx" ON "ClassSchedule"("classSectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_academicYearId_classSectionId_key" ON "ClassSchedule"("academicYearId", "classSectionId");

-- CreateIndex
CREATE INDEX "ScheduleEntry_classScheduleId_dayOfWeek_idx" ON "ScheduleEntry"("classScheduleId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "ScheduleEntry_teacherId_academicYearId_dayOfWeek_idx" ON "ScheduleEntry"("teacherId", "academicYearId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "ScheduleEntry_academicYearId_dayOfWeek_idx" ON "ScheduleEntry"("academicYearId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "ScheduleEntry_subjectId_idx" ON "ScheduleEntry"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleEntry_classScheduleId_dayOfWeek_periodId_key" ON "ScheduleEntry"("classScheduleId", "dayOfWeek", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleEntry_teacherId_academicYearId_dayOfWeek_periodId_key" ON "ScheduleEntry"("teacherId", "academicYearId", "dayOfWeek", "periodId");

-- AddForeignKey
ALTER TABLE "SchedulePeriod" ADD CONSTRAINT "SchedulePeriod_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSchedule" ADD CONSTRAINT "ClassSchedule_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSchedule" ADD CONSTRAINT "ClassSchedule_classSectionId_fkey" FOREIGN KEY ("classSectionId") REFERENCES "ClassSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_classScheduleId_fkey" FOREIGN KEY ("classScheduleId") REFERENCES "ClassSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "SchedulePeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
