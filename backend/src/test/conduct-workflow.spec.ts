import { PrismaClient } from '@prisma/client';
import { CalculationService } from '../modules/results/calculation.service';
import { ReportsService } from '../modules/reports/reports.service';
import { ResultsService } from '../modules/results/results.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

const prisma = new PrismaClient();
const prismaService = prisma as unknown as PrismaService;
const calculationService = new CalculationService(prismaService);
const reportsService = new ReportsService(prismaService, calculationService);
const resultsService = new ResultsService(prismaService);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runStep5Tests() {
  console.log('====================================================');
  console.log('STEP 5: CONDUCT & HOMEROOM WORKFLOW TEST SUITE');
  console.log('====================================================\n');

  const suffix = Date.now().toString().slice(-6);
  const testYear1Id = `yr1-c-${suffix}`;
  const testYear2Id = `yr2-c-${suffix}`;
  const testGradeId = `grd-c-${suffix}`;
  const testSectionAId = `sec-a-c-${suffix}`;
  const testSectionBId = `sec-b-c-${suffix}`;

  const hrTeacherUserId = `u-hr-c-${suffix}`;
  const hrTeacherId = `t-hr-c-${suffix}`;
  const otherTeacherUserId = `u-oth-c-${suffix}`;
  const otherTeacherId = `t-oth-c-${suffix}`;
  const adminUserId = `u-adm-c-${suffix}`;

  const subMath = `sub-mat-c-${suffix}`;
  const subEng = `sub-eng-c-${suffix}`;

  const stu1Id = `stu-1-c-${suffix}`;
  const stu2Id = `stu-2-c-${suffix}`;
  const stu3Id = `stu-3-c-${suffix}`;
  const unEnrolledStuId = `stu-un-c-${suffix}`;

  try {
    console.log('Setting up isolated Step 5 fixtures...');

    // 1. Users
    await prisma.user.createMany({
      data: [
        { id: hrTeacherUserId, loginId: `hr_${suffix}`, password: 'hash', role: 'TEACHER', name: 'Homeroom Teacher C' },
        { id: otherTeacherUserId, loginId: `oth_${suffix}`, password: 'hash', role: 'TEACHER', name: 'Other Teacher C' },
        { id: adminUserId, loginId: `adm_${suffix}`, password: 'hash', role: 'ADMIN', name: 'Admin C' },
        { id: `u-stu1-${suffix}`, loginId: `stu1_${suffix}`, password: 'hash', role: 'STUDENT', name: 'Alice Alpha' },
        { id: `u-stu2-${suffix}`, loginId: `stu2_${suffix}`, password: 'hash', role: 'STUDENT', name: 'Bob Beta' },
        { id: `u-stu3-${suffix}`, loginId: `stu3_${suffix}`, password: 'hash', role: 'STUDENT', name: 'Charlie Gamma' },
        { id: `u-stun-${suffix}`, loginId: `stun_${suffix}`, password: 'hash', role: 'STUDENT', name: 'David Delta' },
      ],
    });

    // 2. Teachers
    await prisma.teacher.createMany({
      data: [
        { id: hrTeacherId, userId: hrTeacherUserId, firstName: 'Homeroom', lastName: 'Teacher', staffId: `STF-HR-${suffix}`, updatedAt: new Date() },
        { id: otherTeacherId, userId: otherTeacherUserId, firstName: 'Other', lastName: 'Teacher', staffId: `STF-OTH-${suffix}`, updatedAt: new Date() },
      ],
    });

    // 3. Academic Years
    await prisma.academicYear.createMany({
      data: [
        { id: testYear1Id, year: `2025/2026-C1-${suffix}`, startDate: new Date('2025-09-01'), endDate: new Date('2026-06-30'), isCurrent: true, updatedAt: new Date() },
        { id: testYear2Id, year: `2026/2027-C2-${suffix}`, startDate: new Date('2026-09-01'), endDate: new Date('2027-06-30'), isCurrent: false, updatedAt: new Date() },
      ],
    });

    // 4. Grade Level
    await prisma.gradeLevel.create({
      data: { id: testGradeId, name: `Grade 10-C-${suffix}`, gradeNumber: 10, status: 'ACTIVE' },
    });

    // 5. Class Sections (ClassSection.status MUST remain ACTIVE)
    await prisma.classSection.createMany({
      data: [
        { id: testSectionAId, name: 'Section A', academicYearId: testYear1Id, gradeLevelId: testGradeId, teacherId: hrTeacherId, status: 'ACTIVE', capacity: 30, updatedAt: new Date() },
        { id: testSectionBId, name: 'Section B', academicYearId: testYear1Id, gradeLevelId: testGradeId, teacherId: otherTeacherId, status: 'ACTIVE', capacity: 30, updatedAt: new Date() },
      ],
    });

    // 6. Subjects
    await prisma.subject.createMany({
      data: [
        { id: subMath, name: `Mathematics C-${suffix}`, code: `MAT-C-${suffix}`, status: 'ACTIVE' },
        { id: subEng, name: `English C-${suffix}`, code: `ENG-C-${suffix}`, status: 'ACTIVE' },
      ],
    });

    // 7. Subject Assignments for Section A
    await (prisma as any).sectionSubjectTeacher.createMany({
      data: [
        { classSectionId: testSectionAId, academicYearId: testYear1Id, subjectId: subMath, teacherId: hrTeacherId },
        { classSectionId: testSectionAId, academicYearId: testYear1Id, subjectId: subEng, teacherId: hrTeacherId },
      ],
    });

    // 8. Students
    await prisma.student.createMany({
      data: [
        { id: stu1Id, userId: `u-stu1-${suffix}`, admissionNo: `ADM-1-${suffix}`, firstName: 'Alice', lastName: 'Alpha', gender: 'Female', status: 'ACTIVE', updatedAt: new Date() },
        { id: stu2Id, userId: `u-stu2-${suffix}`, admissionNo: `ADM-2-${suffix}`, firstName: 'Bob', lastName: 'Beta', gender: 'Male', status: 'ACTIVE', updatedAt: new Date() },
        { id: stu3Id, userId: `u-stu3-${suffix}`, admissionNo: `ADM-3-${suffix}`, firstName: 'Charlie', lastName: 'Gamma', gender: 'Male', status: 'ACTIVE', updatedAt: new Date() },
        { id: unEnrolledStuId, userId: `u-stun-${suffix}`, admissionNo: `ADM-UN-${suffix}`, firstName: 'David', lastName: 'Delta', gender: 'Male', status: 'ACTIVE', updatedAt: new Date() },
      ],
    });

    // 9. Active Enrollments for Section A
    await prisma.studentEnrollment.createMany({
      data: [
        { studentId: stu1Id, academicYearId: testYear1Id, gradeLevelId: testGradeId, classSectionId: testSectionAId, status: 'ACTIVE', enrollmentDate: new Date() },
        { studentId: stu2Id, academicYearId: testYear1Id, gradeLevelId: testGradeId, classSectionId: testSectionAId, status: 'ACTIVE', enrollmentDate: new Date() },
        { studentId: stu3Id, academicYearId: testYear1Id, gradeLevelId: testGradeId, classSectionId: testSectionAId, status: 'ACTIVE', enrollmentDate: new Date() },
      ],
    });

    // 10. Seed Complete Submitted Marks so Section A can be submitted when conduct is ready
    const terms = ['TERM_1', 'TERM_2', 'TERM_3', 'TERM_4'];
    const subjectIds = [subMath, subEng];
    const studentIds = [stu1Id, stu2Id, stu3Id];
    const marksData: any[] = [];
    for (const sid of studentIds) {
      for (const sub of subjectIds) {
        for (const trm of terms) {
          marksData.push({
            studentId: sid,
            subjectId: sub,
            classSectionId: testSectionAId,
            academicYearId: testYear1Id,
            term: trm,
            marks: 85,
            status: 'SUBMITTED',
            updatedAt: new Date(),
          });
        }
      }
    }
    await (prisma as any).subjectResult.createMany({ data: marksData });

    console.log('Fixtures initialized. Executing tests...\n');

    // ──────────────────────────────────────────────────────────────────────────
    // Test A — Save conduct (Homeroom saves Student 1 -> A, Student 2 -> B, Student 3 -> C)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const saveRes = await reportsService.saveConduct(
        {
          classSectionId: testSectionAId,
          academicYearId: testYear1Id,
          conductData: {
            [stu1Id]: 'A',
            [stu2Id]: 'B',
            [stu3Id]: 'C',
          },
        },
        hrTeacherUserId,
      );
      assert(saveRes.success === true, 'saveConduct did not return success');
      assert(saveRes.conductData[stu1Id] === 'A', 'Student 1 conduct mismatch');
      assert(saveRes.conductData[stu2Id] === 'B', 'Student 2 conduct mismatch');
      assert(saveRes.conductData[stu3Id] === 'C', 'Student 3 conduct mismatch');
      results.push({ name: 'Test A — Save conduct (Homeroom saves A, B, C)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test A — Save conduct (Homeroom saves A, B, C)', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test B — Reload conduct (Retrieve roster again via CalculationService)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const roster = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const s1 = roster.students.find((s) => s.studentId === stu1Id);
      const s2 = roster.students.find((s) => s.studentId === stu2Id);
      const s3 = roster.students.find((s) => s.studentId === stu3Id);

      assert(s1?.conduct === 'A', `Expected Student 1 conduct 'A', got ${s1?.conduct}`);
      assert(s2?.conduct === 'B', `Expected Student 2 conduct 'B', got ${s2?.conduct}`);
      assert(s3?.conduct === 'C', `Expected Student 3 conduct 'C', got ${s3?.conduct}`);
      results.push({ name: 'Test B — Reload conduct (CalculationService returns saved conduct)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test B — Reload conduct (CalculationService returns saved conduct)', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test C — Invalid conduct value 'D' rejected
    // ──────────────────────────────────────────────────────────────────────────
    try {
      let rejected = false;
      try {
        await reportsService.saveConduct(
          { classSectionId: testSectionAId, academicYearId: testYear1Id, conductData: { [stu1Id]: 'D' } },
          hrTeacherUserId,
        );
      } catch (e: any) {
        if (e instanceof BadRequestException) rejected = true;
      }
      assert(rejected, 'Invalid conduct "D" was not rejected with BadRequestException');
      results.push({ name: 'Test C — Invalid conduct "D" rejected', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test C — Invalid conduct "D" rejected', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test D — Arbitrary string rejected
    // ──────────────────────────────────────────────────────────────────────────
    try {
      let rejected = false;
      try {
        await reportsService.saveConduct(
          { classSectionId: testSectionAId, academicYearId: testYear1Id, conductData: { [stu1Id]: 'Excellent' } },
          hrTeacherUserId,
        );
      } catch (e: any) {
        if (e instanceof BadRequestException) rejected = true;
      }
      assert(rejected, 'Arbitrary string "Excellent" was not rejected');
      results.push({ name: 'Test D — Arbitrary string "Excellent" rejected', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test D — Arbitrary string "Excellent" rejected', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test E — Wrong homeroom teacher rejected (403 Forbidden)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      let rejected = false;
      try {
        await reportsService.saveConduct(
          { classSectionId: testSectionAId, academicYearId: testYear1Id, conductData: { [stu1Id]: 'A' } },
          otherTeacherUserId,
        );
      } catch (e: any) {
        if (e instanceof ForbiddenException) rejected = true;
      }
      assert(rejected, 'Wrong homeroom teacher was not rejected with 403 Forbidden');
      results.push({ name: 'Test E — Wrong homeroom teacher rejected (403)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test E — Wrong homeroom teacher rejected (403)', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test F — Wrong academic year rejected (BadRequestException)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      let rejected = false;
      try {
        await reportsService.saveConduct(
          { classSectionId: testSectionAId, academicYearId: testYear2Id, conductData: { [stu1Id]: 'A' } },
          hrTeacherUserId,
        );
      } catch (e: any) {
        if (e instanceof BadRequestException) rejected = true;
      }
      assert(rejected, 'Mismatched academicYearId was not rejected with BadRequestException');
      results.push({ name: 'Test F — Wrong academic year rejected', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test F — Wrong academic year rejected', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test G — Wrong section rejected
    // ──────────────────────────────────────────────────────────────────────────
    try {
      let rejected = false;
      try {
        await reportsService.saveConduct(
          { classSectionId: testSectionBId, academicYearId: testYear1Id, conductData: { [stu1Id]: 'A' } },
          hrTeacherUserId,
        );
      } catch (e: any) {
        if (e instanceof ForbiddenException || e instanceof NotFoundException) rejected = true;
      }
      assert(rejected, 'Saving conduct for non-assigned Section B was not rejected');
      results.push({ name: 'Test G — Wrong section rejected', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test G — Wrong section rejected', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test H — Invalid student not enrolled in section rejected
    // ──────────────────────────────────────────────────────────────────────────
    try {
      let rejected = false;
      try {
        await reportsService.saveConduct(
          { classSectionId: testSectionAId, academicYearId: testYear1Id, conductData: { [unEnrolledStuId]: 'A' } },
          hrTeacherUserId,
        );
      } catch (e: any) {
        if (e instanceof BadRequestException) rejected = true;
      }
      assert(rejected, 'Unenrolled student conduct save was not rejected');
      results.push({ name: 'Test H — Invalid student not enrolled in section rejected', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test H — Invalid student not enrolled in section rejected', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test I — Draft editable
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const editRes = await reportsService.saveConduct(
        { classSectionId: testSectionAId, academicYearId: testYear1Id, conductData: { [stu1Id]: 'B' } },
        hrTeacherUserId,
      );
      assert(editRes.conductData[stu1Id] === 'B', 'Student 1 conduct was not updated to B');
      assert(editRes.status === 'DRAFT', 'Review status must remain DRAFT');
      results.push({ name: 'Test I — Draft editable (status = DRAFT allows conduct update)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test I — Draft editable (status = DRAFT allows conduct update)', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test J — Rejected editable (status = REJECTED allows edit, status remains REJECTED)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      // First ensure review has all students with conduct to submit then reject
      await reportsService.saveConduct(
        { classSectionId: testSectionAId, academicYearId: testYear1Id, conductData: { [stu1Id]: 'A', [stu2Id]: 'B', [stu3Id]: 'C' } },
        hrTeacherUserId,
      );
      await reportsService.submitToAdmin(testSectionAId, testYear1Id, 'roster', hrTeacherUserId);
      const rev = await (prisma as any).classRosterReview.findUnique({
        where: { classSectionId_academicYearId: { classSectionId: testSectionAId, academicYearId: testYear1Id } },
      });
      await reportsService.rejectRoster(rev.id, adminUserId, 'Please update conduct for Student 2');

      // Now edit conduct while REJECTED
      const editRejectedRes = await reportsService.saveConduct(
        { classSectionId: testSectionAId, academicYearId: testYear1Id, conductData: { [stu2Id]: 'A' } },
        hrTeacherUserId,
      );
      assert(editRejectedRes.conductData[stu2Id] === 'A', 'Conduct was not updated in REJECTED state');
      assert(editRejectedRes.status === 'REJECTED', `Status should remain REJECTED, got ${editRejectedRes.status}`);
      results.push({ name: 'Test J — Rejected editable (status remains REJECTED after edit)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test J — Rejected editable (status remains REJECTED after edit)', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test K — Submitted locked (SUBMITTED_TO_ADMIN blocks edit)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      // Resubmit to admin
      await reportsService.submitToAdmin(testSectionAId, testYear1Id, 'roster', hrTeacherUserId);

      let blocked = false;
      try {
        await reportsService.saveConduct(
          { classSectionId: testSectionAId, academicYearId: testYear1Id, conductData: { [stu1Id]: 'C' } },
          hrTeacherUserId,
        );
      } catch (e: any) {
        if (e instanceof BadRequestException) blocked = true;
      }
      assert(blocked, 'SUBMITTED_TO_ADMIN roster did not block conduct modification');
      results.push({ name: 'Test K — Submitted locked (SUBMITTED_TO_ADMIN blocks conduct edit)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test K — Submitted locked (SUBMITTED_TO_ADMIN blocks conduct edit)', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test L — Approved locked (APPROVED blocks edit)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const rev = await (prisma as any).classRosterReview.findUnique({
        where: { classSectionId_academicYearId: { classSectionId: testSectionAId, academicYearId: testYear1Id } },
      });
      await reportsService.approveRoster(rev.id, adminUserId);

      let blocked = false;
      try {
        await reportsService.saveConduct(
          { classSectionId: testSectionAId, academicYearId: testYear1Id, conductData: { [stu1Id]: 'C' } },
          hrTeacherUserId,
        );
      } catch (e: any) {
        if (e instanceof BadRequestException) blocked = true;
      }
      assert(blocked, 'APPROVED roster did not block conduct modification');
      results.push({ name: 'Test L — Approved locked (APPROVED blocks conduct edit)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test L — Approved locked (APPROVED blocks conduct edit)', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test M — Reopened approved roster allows editing again
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const rev = await (prisma as any).classRosterReview.findUnique({
        where: { classSectionId_academicYearId: { classSectionId: testSectionAId, academicYearId: testYear1Id } },
      });
      await reportsService.reopenRoster(rev.id, adminUserId, 'Conduct adjustments requested');

      const reopenEditRes = await reportsService.saveConduct(
        { classSectionId: testSectionAId, academicYearId: testYear1Id, conductData: { [stu3Id]: 'A' } },
        hrTeacherUserId,
      );
      assert(reopenEditRes.conductData[stu3Id] === 'A', 'Conduct update failed after reopen');
      assert(reopenEditRes.status === 'DRAFT', 'Status should be DRAFT after reopen');
      results.push({ name: 'Test M — Reopened approved roster allows editing again', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test M — Reopened approved roster allows editing again', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test N — Missing conduct blocks submission
    // ──────────────────────────────────────────────────────────────────────────
    try {
      // Clear Student 2's conduct by setting to empty string
      await reportsService.saveConduct(
        { classSectionId: testSectionAId, academicYearId: testYear1Id, conductData: { [stu2Id]: '' } },
        hrTeacherUserId,
      );

      let blocked = false;
      let errMsg = '';
      try {
        await reportsService.submitToAdmin(testSectionAId, testYear1Id, 'roster', hrTeacherUserId);
      } catch (e: any) {
        if (e instanceof BadRequestException) {
          blocked = true;
          errMsg = e.message;
        }
      }
      assert(blocked, 'Submission was not blocked when Student 2 lacked conduct');
      assert(errMsg.includes('Bob Beta') || errMsg.includes(stu2Id), `Error message should mention missing student, got: ${errMsg}`);
      results.push({ name: 'Test N — Missing conduct blocks submission (lists missing student)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test N — Missing conduct blocks submission (lists missing student)', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test O — Complete conduct allows submission (DRAFT -> SUBMITTED_TO_ADMIN)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      await reportsService.saveConduct(
        { classSectionId: testSectionAId, academicYearId: testYear1Id, conductData: { [stu1Id]: 'A', [stu2Id]: 'B', [stu3Id]: 'C' } },
        hrTeacherUserId,
      );

      const submitReceipt = await reportsService.submitToAdmin(testSectionAId, testYear1Id, 'roster', hrTeacherUserId);
      assert(submitReceipt.success === true, 'Submission did not succeed');
      assert(submitReceipt.status === 'SUBMITTED_TO_ADMIN', `Status should be SUBMITTED_TO_ADMIN, got ${submitReceipt.status}`);
      results.push({ name: 'Test O — Complete conduct allows submission (DRAFT -> SUBMITTED_TO_ADMIN)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test O — Complete conduct allows submission (DRAFT -> SUBMITTED_TO_ADMIN)', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test P — Conduct persists after submission
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const rosterAfterSubmit = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const s1 = rosterAfterSubmit.students.find((s) => s.studentId === stu1Id);
      const s2 = rosterAfterSubmit.students.find((s) => s.studentId === stu2Id);
      const s3 = rosterAfterSubmit.students.find((s) => s.studentId === stu3Id);

      assert(s1?.conduct === 'A', `Student 1 conduct lost after submit: ${s1?.conduct}`);
      assert(s2?.conduct === 'B', `Student 2 conduct lost after submit: ${s2?.conduct}`);
      assert(s3?.conduct === 'C', `Student 3 conduct lost after submit: ${s3?.conduct}`);
      results.push({ name: 'Test P — Conduct persists after submission', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test P — Conduct persists after submission', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test Q — Admin sees conduct
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const adminRoster = await reportsService.generateClassRoster(testSectionAId, testYear1Id, 'TERM_1');
      const a1 = adminRoster.find((s: any) => s.studentId === stu1Id);
      const a2 = adminRoster.find((s: any) => s.studentId === stu2Id);
      const a3 = adminRoster.find((s: any) => s.studentId === stu3Id);

      assert((a1 as any)?.conduct === 'A', `Admin roster conduct mismatch for Student 1: ${(a1 as any)?.conduct}`);
      assert((a2 as any)?.conduct === 'B', `Admin roster conduct mismatch for Student 2: ${(a2 as any)?.conduct}`);
      assert((a3 as any)?.conduct === 'C', `Admin roster conduct mismatch for Student 3: ${(a3 as any)?.conduct}`);
      results.push({ name: 'Test Q — Admin sees conduct in generateClassRoster', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test Q — Admin sees conduct in generateClassRoster', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test R — Paper roster displays conduct
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const rev = await (prisma as any).classRosterReview.findUnique({
        where: { classSectionId_academicYearId: { classSectionId: testSectionAId, academicYearId: testYear1Id } },
      });
      await reportsService.approveRoster(rev.id, adminUserId);

      const printPayload = await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, adminUserId, 'ADMIN');
      const p1 = printPayload.students.find((s) => s.studentId === stu1Id);
      const p2 = printPayload.students.find((s) => s.studentId === stu2Id);
      const p3 = printPayload.students.find((s) => s.studentId === stu3Id);

      assert(p1?.conduct === 'A', `Paper student 1 conduct mismatch: ${p1?.conduct}`);
      assert(p2?.conduct === 'B', `Paper student 2 conduct mismatch: ${p2?.conduct}`);
      assert(p3?.conduct === 'C', `Paper student 3 conduct mismatch: ${p3?.conduct}`);

      const rowGroup1 = printPayload.paperRows.find((r) => r.studentId === stu1Id);
      assert(rowGroup1?.conduct === 'A', `Paper row group conduct mismatch: ${rowGroup1?.conduct}`);
      results.push({ name: 'Test R — Paper roster displays conduct (7-row print payload)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test R — Paper roster displays conduct (7-row print payload)', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test S — Print gate preserved (locked when DRAFT / SUBMITTED / REJECTED)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const rev = await (prisma as any).classRosterReview.findUnique({
        where: { classSectionId_academicYearId: { classSectionId: testSectionAId, academicYearId: testYear1Id } },
      });
      // Reopen to DRAFT
      await reportsService.reopenRoster(rev.id, adminUserId, 'Test S check');

      let draftPrintBlocked = false;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, adminUserId, 'ADMIN');
      } catch (e: any) {
        if (e instanceof BadRequestException) draftPrintBlocked = true;
      }
      assert(draftPrintBlocked, 'DRAFT roster allowed official print');

      // Re-approve so print is allowed again
      await reportsService.submitToAdmin(testSectionAId, testYear1Id, 'roster', hrTeacherUserId);
      await reportsService.approveRoster(rev.id, adminUserId);
      const allowedPrint = await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, adminUserId, 'ADMIN');
      assert(allowedPrint.officialHeader.status === 'APPROVED', 'Approved print did not return APPROVED status');
      results.push({ name: 'Test S — Print gate preserved (locked unless APPROVED)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test S — Print gate preserved (locked unless APPROVED)', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test T — No ClassSection mutation (status remains ACTIVE)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const secA = await prisma.classSection.findUnique({ where: { id: testSectionAId } });
      const secB = await prisma.classSection.findUnique({ where: { id: testSectionBId } });

      assert(secA?.status === 'ACTIVE', `Section A status mutated to ${secA?.status}`);
      assert(secB?.status === 'ACTIVE', `Section B status mutated to ${secB?.status}`);
      results.push({ name: 'Test T — No ClassSection mutation (status remains ACTIVE)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test T — No ClassSection mutation (status remains ACTIVE)', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test U — No cross-section leakage
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const rosterB = await calculationService.calculateSectionRoster(testYear1Id, testSectionBId);
      rosterB.students.forEach((s) => {
        assert(s.conduct === null, `Section B student ${s.studentId} unexpectedly inherited conduct: ${s.conduct}`);
      });
      results.push({ name: 'Test U — No cross-section leakage (Section A conduct not leaked to B)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test U — No cross-section leakage (Section A conduct not leaked to B)', passed: false, error: e.message });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test V — No cross-year leakage
    // ──────────────────────────────────────────────────────────────────────────
    try {
      // 1. Calling calculateSectionRoster with mismatched academic year is rejected
      let yearMismatchBlocked = false;
      try {
        await calculationService.calculateSectionRoster(testYear2Id, testSectionAId);
      } catch (e: any) {
        if (e instanceof BadRequestException) yearMismatchBlocked = true;
      }
      assert(yearMismatchBlocked, 'Mismatched academic year was not blocked');

      // 2. A section in Year 2 does not inherit Year 1's conduct
      const secY2Id = `sec-y2-${suffix}`;
      await prisma.classSection.create({
        data: {
          id: secY2Id,
          name: 'Section Year 2',
          academicYearId: testYear2Id,
          gradeLevelId: testGradeId,
          teacherId: hrTeacherId,
          status: 'ACTIVE',
          capacity: 30,
          updatedAt: new Date(),
        },
      });
      await prisma.studentEnrollment.create({
        data: {
          studentId: stu1Id,
          academicYearId: testYear2Id,
          gradeLevelId: testGradeId,
          classSectionId: secY2Id,
          status: 'ACTIVE',
          enrollmentDate: new Date(),
        },
      });

      const rosterY2 = await calculationService.calculateSectionRoster(testYear2Id, secY2Id);
      rosterY2.students.forEach((s) => {
        assert(s.conduct === null, `Year 2 unexpectedly inherited Year 1 conduct: ${s.conduct}`);
      });
      results.push({ name: 'Test V — No cross-year leakage (Year 1 conduct not leaked to Year 2)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Test V — No cross-year leakage (Year 1 conduct not leaked to Year 2)', passed: false, error: e.message });
    }

  } finally {
    console.log('Cleaning up isolated Step 5 fixtures...');
    try {
      await (prisma as any).classRosterReview.deleteMany({
        where: { classSectionId: { in: [testSectionAId, testSectionBId, `sec-y2-${suffix}`] } },
      });
      await (prisma as any).subjectResult.deleteMany({
        where: { classSectionId: { in: [testSectionAId, testSectionBId, `sec-y2-${suffix}`] } },
      });
      await (prisma as any).sectionSubjectTeacher.deleteMany({
        where: { classSectionId: { in: [testSectionAId, testSectionBId, `sec-y2-${suffix}`] } },
      });
      await prisma.studentEnrollment.deleteMany({
        where: { classSectionId: { in: [testSectionAId, testSectionBId, `sec-y2-${suffix}`] } },
      });
      await prisma.student.deleteMany({
        where: { id: { in: [stu1Id, stu2Id, stu3Id, unEnrolledStuId] } },
      });
      await prisma.subject.deleteMany({
        where: { id: { in: [subMath, subEng] } },
      });
      await prisma.classSection.deleteMany({
        where: { id: { in: [testSectionAId, testSectionBId, `sec-y2-${suffix}`] } },
      });
      await prisma.gradeLevel.deleteMany({
        where: { id: testGradeId },
      });
      await prisma.academicYear.deleteMany({
        where: { id: { in: [testYear1Id, testYear2Id] } },
      });
      await prisma.teacher.deleteMany({
        where: { id: { in: [hrTeacherId, otherTeacherId] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [hrTeacherUserId, otherTeacherUserId, adminUserId] } },
      });
      console.log('Cleaned up Step 5 test fixtures.');
    } catch (cleanupErr: any) {
      console.error('Cleanup warning:', cleanupErr.message);
    }
  }

  console.log('\n====================================================');
  console.log('STEP 5 TEST EXECUTION SUMMARY');
  console.log('====================================================');
  let passCount = 0;
  results.forEach((r) => {
    if (r.passed) {
      passCount++;
      console.log(`✅ [PASS] ${r.name}`);
    } else {
      console.log(`❌ [FAIL] ${r.name} — Error: ${r.error}`);
    }
  });
  console.log('====================================================');
  console.log(`TOTAL: ${passCount}/${results.length} PASSED`);
  console.log('====================================================\n');

  if (passCount !== results.length) {
    process.exit(1);
  }
  process.exit(0);
}

runStep5Tests().catch((e) => {
  console.error('Fatal Step 5 test suite error:', e);
  process.exit(1);
});
