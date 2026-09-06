import { PrismaClient } from '@prisma/client';
import { ResultsService } from '../modules/results/results.service';
import { ReportsService } from '../modules/reports/reports.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

const prisma = new PrismaClient();
const prismaService = prisma as unknown as PrismaService;
const resultsService = new ResultsService(prismaService);
const reportsService = new ReportsService(prismaService);

interface TestResults {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResults[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('STEP 2: SUBJECT GRADE CORRECTION WORKFLOW TEST SUITE');
  console.log('====================================================\n');

  const suffix = Date.now().toString().slice(-6);
  const testYearId = `yr-${suffix}`;
  const testAltYearId = `yr-alt-${suffix}`;
  const testGradeId = `grd-${suffix}`;
  const testSectionId = `sec-${suffix}`;

  const hrUserId = `u-hr-${suffix}`;
  const hrTeacherId = `t-hr-${suffix}`;

  const s1UserId = `u-s1-${suffix}`;
  const s1TeacherId = `t-s1-${suffix}`;

  const s2UserId = `u-s2-${suffix}`;
  const s2TeacherId = `t-s2-${suffix}`;

  const otherUserId = `u-oth-${suffix}`;
  const otherTeacherId = `t-oth-${suffix}`;

  const adminUserId = `u-adm-${suffix}`;

  const stu1UserId = `u-st1-${suffix}`;
  const stu1Id = `st1-${suffix}`;
  const stu2UserId = `u-st2-${suffix}`;
  const stu2Id = `st2-${suffix}`;

  const subPhysics = `sub-phy-${suffix}`;
  const subMath = `sub-mat-${suffix}`;
  const subEnglish = `sub-eng-${suffix}`;
  const subChemistry = `sub-che-${suffix}`;

  try {
    console.log('Setting up isolated Step 2 test fixtures...');

    // 1. Academic Years
    await prisma.academicYear.createMany({
      data: [
        { id: testYearId, year: `2098/${suffix}`, startDate: new Date('2098-09-01'), endDate: new Date('2099-06-30'), isCurrent: false, updatedAt: new Date() },
        { id: testAltYearId, year: `2097/${suffix}`, startDate: new Date('2097-09-01'), endDate: new Date('2098-06-30'), isCurrent: false, updatedAt: new Date() },
      ],
    });

    // 2. Grade Level
    await prisma.gradeLevel.create({
      data: { id: testGradeId, name: `Grade ${suffix}`, gradeNumber: 11, status: 'ACTIVE' },
    });

    // 3. Users & Teachers
    await prisma.user.createMany({
      data: [
        { id: hrUserId, loginId: `hr_${suffix}`, name: 'Homeroom Teacher', password: 'hash', role: 'TEACHER' },
        { id: s1UserId, loginId: `s1_${suffix}`, name: 'Subject Teacher 1', password: 'hash', role: 'TEACHER' },
        { id: s2UserId, loginId: `s2_${suffix}`, name: 'Subject Teacher 2', password: 'hash', role: 'TEACHER' },
        { id: otherUserId, loginId: `oth_${suffix}`, name: 'Other Teacher', password: 'hash', role: 'TEACHER' },
        { id: adminUserId, loginId: `adm_${suffix}`, name: 'Admin User', password: 'hash', role: 'ADMIN' },
        { id: stu1UserId, loginId: `st1_${suffix}`, name: 'Student One', password: 'hash', role: 'STUDENT' },
        { id: stu2UserId, loginId: `st2_${suffix}`, name: 'Student Two', password: 'hash', role: 'STUDENT' },
      ],
    });

    await prisma.teacher.createMany({
      data: [
        { id: hrTeacherId, userId: hrUserId, firstName: 'Homeroom', lastName: 'Master', staffId: `HR-${suffix}`, updatedAt: new Date() },
        { id: s1TeacherId, userId: s1UserId, firstName: 'Physics', lastName: 'Guru', staffId: `S1-${suffix}`, updatedAt: new Date() },
        { id: s2TeacherId, userId: s2UserId, firstName: 'Math', lastName: 'Wizard', staffId: `S2-${suffix}`, updatedAt: new Date() },
        { id: otherTeacherId, userId: otherUserId, firstName: 'Stranger', lastName: 'Teacher', staffId: `OT-${suffix}`, updatedAt: new Date() },
      ],
    });

    // 4. Class Section (assigned to hrTeacher, status = ACTIVE)
    await prisma.classSection.create({
      data: {
        id: testSectionId,
        name: `Section S2-${suffix}`,
        academicYearId: testYearId,
        gradeLevelId: testGradeId,
        teacherId: hrTeacherId,
        status: 'ACTIVE',
      },
    });

    // 5. Students & Enrollments
    await prisma.student.createMany({
      data: [
        { id: stu1Id, userId: stu1UserId, admissionNo: `ADM1-${suffix}`, firstName: 'Alice', lastName: 'One', classSectionId: testSectionId, updatedAt: new Date() },
        { id: stu2Id, userId: stu2UserId, admissionNo: `ADM2-${suffix}`, firstName: 'Bob', lastName: 'Two', classSectionId: testSectionId, updatedAt: new Date() },
      ],
    });

    await prisma.studentEnrollment.createMany({
      data: [
        { studentId: stu1Id, academicYearId: testYearId, gradeLevelId: testGradeId, classSectionId: testSectionId, status: 'ACTIVE' },
        { studentId: stu2Id, academicYearId: testYearId, gradeLevelId: testGradeId, classSectionId: testSectionId, status: 'ACTIVE' },
      ],
    });

    // 6. Subjects
    await prisma.subject.createMany({
      data: [
        { id: subPhysics, code: `PHY-${suffix}`, name: 'Physics', status: 'ACTIVE' },
        { id: subMath, code: `MAT-${suffix}`, name: 'Mathematics', status: 'ACTIVE' },
        { id: subEnglish, code: `ENG-${suffix}`, name: 'English', status: 'ACTIVE' },
        { id: subChemistry, code: `CHE-${suffix}`, name: 'Chemistry', status: 'ACTIVE' },
      ],
    });

    // 7. Section Subject Teacher assignments
    await (prisma as any).sectionSubjectTeacher.createMany({
      data: [
        { classSectionId: testSectionId, subjectId: subPhysics, teacherId: s1TeacherId, academicYearId: testYearId },
        { classSectionId: testSectionId, subjectId: subChemistry, teacherId: s1TeacherId, academicYearId: testYearId },
        { classSectionId: testSectionId, subjectId: subMath, teacherId: s2TeacherId, academicYearId: testYearId },
        { classSectionId: testSectionId, subjectId: subEnglish, teacherId: s2TeacherId, academicYearId: testYearId },
      ],
    });

    console.log('Test fixtures initialized successfully.\n');

    // ── Test A: Subject teacher can submit: DRAFT → SUBMITTED ────────────────
    try {
      const submitRes = await resultsService.submitToHomeroom(
        {
          classSectionId: testSectionId,
          academicYearId: testYearId,
          subjectId: subPhysics,
          term: 'TERM_1',
          grades: [
            { studentId: stu1Id, marks: 88 },
            { studentId: stu2Id, marks: 92 },
          ],
        },
        s1UserId,
      );
      assert(submitRes.success === true, 'Submission did not succeed');

      const count = await (prisma as any).subjectResult.count({
        where: { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1', status: 'SUBMITTED' },
      });
      assert(count === 2, `Expected 2 SUBMITTED rows, got ${count}`);
      results.push({ name: 'Test A — Subject teacher can submit: DRAFT → SUBMITTED', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test A — Subject teacher can submit: DRAFT → SUBMITTED', passed: false, error: err.message });
    }

    // ── Test B: Assigned homeroom can return: SUBMITTED → RETURNED_FOR_CORRECTION ──
    try {
      const returnRes = await resultsService.returnSubjectResultToTeacher(
        {
          classSectionId: testSectionId,
          academicYearId: testYearId,
          subjectId: subPhysics,
          term: 'TERM_1',
          reason: 'Please recheck Student Two final mark',
        },
        hrUserId,
      );
      assert(returnRes.success === true, 'Return failed');
      assert(returnRes.status === 'RETURNED_FOR_CORRECTION', 'Return status mismatch');

      const returnedCount = await (prisma as any).subjectResult.count({
        where: { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1', status: 'RETURNED_FOR_CORRECTION' },
      });
      assert(returnedCount === 2, `Expected 2 RETURNED_FOR_CORRECTION rows, got ${returnedCount}`);

      const corrReq = await (prisma as any).subjectCorrectionRequest.findFirst({
        where: { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1', status: 'PENDING' },
      });
      assert(corrReq !== null, 'Correction request record not found');
      assert(corrReq.reason === 'Please recheck Student Two final mark', 'Correction reason mismatch');
      results.push({ name: 'Test B — Assigned homeroom can return: SUBMITTED → RETURNED_FOR_CORRECTION with reason', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test B — Assigned homeroom can return: SUBMITTED → RETURNED_FOR_CORRECTION with reason', passed: false, error: err.message });
    }

    // ── Test C: Wrong homeroom gets 403 ──────────────────────────────────────
    try {
      let threw403 = false;
      try {
        await resultsService.returnSubjectResultToTeacher(
          {
            classSectionId: testSectionId,
            academicYearId: testYearId,
            subjectId: subPhysics,
            term: 'TERM_1',
            reason: 'Unauthorized return',
          },
          otherUserId,
        );
      } catch (e: any) {
        if (e instanceof ForbiddenException) threw403 = true;
      }
      assert(threw403, 'Non-homeroom teacher was not rejected with 403 Forbidden');
      results.push({ name: 'Test C — Wrong homeroom gets 403 Forbidden', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test C — Wrong homeroom gets 403 Forbidden', passed: false, error: err.message });
    }

    // ── Test D: Returned subject can be edited by the assigned subject teacher ──
    try {
      const draftRes = await resultsService.saveGradesDraft(
        {
          classSectionId: testSectionId,
          academicYearId: testYearId,
          subjectId: subPhysics,
          term: 'TERM_1',
          grades: [
            { studentId: stu1Id, marks: 88 },
            { studentId: stu2Id, marks: 95 }, // Corrected from 92 to 95
          ],
        },
        s1UserId,
      );
      assert(draftRes.savedCount === 2, `Expected 2 saved grades, got ${draftRes.savedCount}`);

      const s2Row = await (prisma as any).subjectResult.findUnique({
        where: { studentId_subjectId_classSectionId_academicYearId_term: { studentId: stu2Id, subjectId: subPhysics, classSectionId: testSectionId, academicYearId: testYearId, term: 'TERM_1' } },
      });
      assert(s2Row.marks === 95, `Expected corrected mark 95, got ${s2Row.marks}`);
      assert(s2Row.status === 'DRAFT', `Expected status DRAFT, got ${s2Row.status}`);
      results.push({ name: 'Test D — Returned subject can be edited by the assigned subject teacher', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test D — Returned subject can be edited by the assigned subject teacher', passed: false, error: err.message });
    }

    // ── Test E: Teacher A cannot edit Teacher B's assigned subject ────────────
    try {
      let threwForbidden = false;
      try {
        await resultsService.saveGradesDraft(
          {
            classSectionId: testSectionId,
            academicYearId: testYearId,
            subjectId: subMath, // Assigned to Teacher 2
            term: 'TERM_1',
            grades: [{ studentId: stu1Id, marks: 50 }],
          },
          s1UserId, // Teacher 1 attempts to edit Teacher 2's subject
        );
      } catch (e: any) {
        if (e instanceof ForbiddenException) threwForbidden = true;
      }
      assert(threwForbidden, 'Subject teacher was allowed to edit unassigned subject');
      results.push({ name: "Test E — Teacher A cannot edit Teacher B's assigned subject (403 Forbidden)", passed: true });
    } catch (err: any) {
      results.push({ name: "Test E — Teacher A cannot edit Teacher B's assigned subject (403 Forbidden)", passed: false, error: err.message });
    }

    // ── Test F: Corrected subject can be resubmitted: DRAFT/RETURNED → SUBMITTED ──
    try {
      const resubmit = await resultsService.submitToHomeroom(
        {
          classSectionId: testSectionId,
          academicYearId: testYearId,
          subjectId: subPhysics,
          term: 'TERM_1',
        },
        s1UserId,
      );
      assert(resubmit.success === true, 'Resubmission failed');

      const submittedCount = await (prisma as any).subjectResult.count({
        where: { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1', status: 'SUBMITTED' },
      });
      assert(submittedCount === 2, `Expected 2 SUBMITTED rows, got ${submittedCount}`);
      results.push({ name: 'Test F — Corrected subject can be resubmitted to SUBMITTED', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test F — Corrected subject can be resubmitted to SUBMITTED', passed: false, error: err.message });
    }

    // ── Test G: Only the selected subject is returned (Subject-level isolation) ──
    try {
      // First submit Math, English, Chemistry
      await resultsService.submitToHomeroom(
        { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subMath, term: 'TERM_1', grades: [{ studentId: stu1Id, marks: 90 }, { studentId: stu2Id, marks: 91 }] },
        s2UserId,
      );
      await resultsService.submitToHomeroom(
        { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subEnglish, term: 'TERM_1', grades: [{ studentId: stu1Id, marks: 85 }, { studentId: stu2Id, marks: 87 }] },
        s2UserId,
      );
      await resultsService.submitToHomeroom(
        { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subChemistry, term: 'TERM_1', grades: [{ studentId: stu1Id, marks: 78 }, { studentId: stu2Id, marks: 82 }] },
        s1UserId,
      );

      // Now return ONLY Physics
      await resultsService.returnSubjectResultToTeacher(
        { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1', reason: 'Second check' },
        hrUserId,
      );

      // Verify statuses
      const phyStatus = await (prisma as any).subjectResult.findFirst({ where: { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1' } });
      const matStatus = await (prisma as any).subjectResult.findFirst({ where: { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subMath, term: 'TERM_1' } });
      const engStatus = await (prisma as any).subjectResult.findFirst({ where: { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subEnglish, term: 'TERM_1' } });
      const cheStatus = await (prisma as any).subjectResult.findFirst({ where: { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subChemistry, term: 'TERM_1' } });

      assert(phyStatus.status === 'RETURNED_FOR_CORRECTION', `Physics should be RETURNED_FOR_CORRECTION, got ${phyStatus.status}`);
      assert(matStatus.status === 'SUBMITTED', `Math should remain SUBMITTED, got ${matStatus.status}`);
      assert(engStatus.status === 'SUBMITTED', `English should remain SUBMITTED, got ${engStatus.status}`);
      assert(cheStatus.status === 'SUBMITTED', `Chemistry should remain SUBMITTED, got ${cheStatus.status}`);

      results.push({ name: 'Test G — Only the selected subject is returned (subject-level isolation)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test G — Only the selected subject is returned (subject-level isolation)', passed: false, error: err.message });
    }

    // ── Test H: Grade modification rejected when ClassRosterReview = APPROVED ──
    try {
      // Re-submit Physics so all subjects are submitted
      await resultsService.submitToHomeroom(
        { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1' },
        s1UserId,
      );

      // Save conduct for enrolled students so roster can be submitted
      await reportsService.saveConduct(
        {
          classSectionId: testSectionId,
          academicYearId: testYearId,
          conductData: { [stu1Id]: 'A', [stu2Id]: 'B' },
        },
        hrUserId,
      );

      // Submit roster to admin and approve it
      await reportsService.submitToAdmin(testSectionId, testYearId, 'roster', hrUserId);
      const review = await (prisma as any).classRosterReview.findUnique({
        where: { classSectionId_academicYearId: { classSectionId: testSectionId, academicYearId: testYearId } },
      });
      await reportsService.approveRoster(review.id, adminUserId);

      // Attempt to return subject under APPROVED roster
      let returnBlocked = false;
      try {
        await resultsService.returnSubjectResultToTeacher(
          { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1', reason: 'Attempt return when approved' },
          hrUserId,
        );
      } catch (e: any) {
        if (e instanceof BadRequestException) returnBlocked = true;
      }
      assert(returnBlocked, 'Subject return was not blocked when roster is APPROVED');
      results.push({ name: 'Test H — Grade modification / return rejected when ClassRosterReview = APPROVED', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test H — Grade modification / return rejected when ClassRosterReview = APPROVED', passed: false, error: err.message });
    }

    // ── Test I: Grade modification rejected when ClassRosterReview = SUBMITTED_TO_ADMIN ──
    try {
      // Reopen approved roster to DRAFT first
      const review = await (prisma as any).classRosterReview.findUnique({
        where: { classSectionId_academicYearId: { classSectionId: testSectionId, academicYearId: testYearId } },
      });
      await reportsService.reopenRoster(review.id, 'Need corrections', adminUserId);

      // Submit to admin again: status = SUBMITTED_TO_ADMIN
      await reportsService.submitToAdmin(testSectionId, testYearId, 'roster', hrUserId);

      // Attempt to return subject when SUBMITTED_TO_ADMIN
      let returnBlocked = false;
      try {
        await resultsService.returnSubjectResultToTeacher(
          { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1', reason: 'Attempt return when submitted to admin' },
          hrUserId,
        );
      } catch (e: any) {
        if (e instanceof BadRequestException) returnBlocked = true;
      }
      assert(returnBlocked, 'Subject return was not blocked when roster is SUBMITTED_TO_ADMIN');

      // Attempt to save draft when SUBMITTED_TO_ADMIN
      let draftBlocked = false;
      try {
        await resultsService.saveGradesDraft(
          { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1', grades: [{ studentId: stu1Id, marks: 99 }] },
          s1UserId,
        );
      } catch (e: any) {
        if (e instanceof BadRequestException) draftBlocked = true;
      }
      assert(draftBlocked, 'Draft edit was not blocked when roster is SUBMITTED_TO_ADMIN');

      results.push({ name: 'Test I — Grade modification / return rejected when ClassRosterReview = SUBMITTED_TO_ADMIN', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test I — Grade modification / return rejected when ClassRosterReview = SUBMITTED_TO_ADMIN', passed: false, error: err.message });
    }

    // ── Test J: Correction is allowed when ClassRosterReview = REJECTED ──────
    try {
      const review = await (prisma as any).classRosterReview.findUnique({
        where: { classSectionId_academicYearId: { classSectionId: testSectionId, academicYearId: testYearId } },
      });
      await reportsService.rejectRoster(review.id, adminUserId, 'Data inconsistencies found');

      // Return subject under REJECTED review
      const returnRes = await resultsService.returnSubjectResultToTeacher(
        { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1', reason: 'Fix marks after admin rejection' },
        hrUserId,
      );
      assert(returnRes.success === true, 'Return failed on REJECTED roster');
      results.push({ name: 'Test J — Correction is allowed when ClassRosterReview = REJECTED', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test J — Correction is allowed when ClassRosterReview = REJECTED', passed: false, error: err.message });
    }

    // ── Test K: Correction is allowed when ClassRosterReview = DRAFT ─────────
    try {
      // Resubmit physics to make it SUBMITTED again
      await resultsService.submitToHomeroom(
        { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1' },
        s1UserId,
      );

      // Save draft roster review (transitions from REJECTED to DRAFT)
      await reportsService.saveRosterDraft({ classSectionId: testSectionId, academicYearId: testYearId }, hrUserId);

      // Return subject when DRAFT
      const returnRes = await resultsService.returnSubjectResultToTeacher(
        { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1', reason: 'Homeroom review during draft' },
        hrUserId,
      );
      assert(returnRes.success === true, 'Return failed on DRAFT roster');
      results.push({ name: 'Test K — Correction is allowed when ClassRosterReview = DRAFT', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test K — Correction is allowed when ClassRosterReview = DRAFT', passed: false, error: err.message });
    }

    // ── Test L: Academic-year isolation ─────────────────────────────────────
    try {
      let threwYearMismatch = false;
      try {
        await resultsService.returnSubjectResultToTeacher(
          {
            classSectionId: testSectionId,
            academicYearId: testAltYearId, // Mismatched academic year
            subjectId: subPhysics,
            term: 'TERM_1',
            reason: 'Year mismatch attempt',
          },
          hrUserId,
        );
      } catch (e: any) {
        if (e instanceof BadRequestException) threwYearMismatch = true;
      }
      assert(threwYearMismatch, 'Academic year mismatch was not rejected');
      results.push({ name: 'Test L — Academic-year isolation enforced', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test L — Academic-year isolation enforced', passed: false, error: err.message });
    }

    // ── Test M: Correction reason is persisted and returned to the subject teacher ──
    try {
      const statusRes = await resultsService.getSubjectStatus(
        {
          classSectionId: testSectionId,
          academicYearId: testYearId,
          subjectId: subPhysics,
          term: 'TERM_1',
        },
        s1UserId,
      );
      assert(statusRes.correctionRequired === true, 'correctionRequired should be true');
      assert(statusRes.correctionReason === 'Homeroom review during draft', `Reason mismatch: ${statusRes.correctionReason}`);
      assert(statusRes.returnedBy === 'Homeroom Master', `Returned by name mismatch: ${statusRes.returnedBy}`);
      assert(statusRes.grades.length === 2, `Expected 2 grades loaded, got ${statusRes.grades.length}`);
      results.push({ name: 'Test M — Correction reason is persisted and returned via getSubjectStatus', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test M — Correction reason is persisted and returned via getSubjectStatus', passed: false, error: err.message });
    }

    // ── Test N: Resubmission resolves the correction request ────────────────
    try {
      await resultsService.submitToHomeroom(
        {
          classSectionId: testSectionId,
          academicYearId: testYearId,
          subjectId: subPhysics,
          term: 'TERM_1',
        },
        s1UserId,
      );

      const resolved = await (prisma as any).subjectCorrectionRequest.findFirst({
        where: { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1' },
        orderBy: { createdAt: 'desc' },
      });
      assert(resolved.status === 'RESOLVED', `Expected status RESOLVED, got ${resolved.status}`);
      assert(resolved.resolvedAt !== null, 'resolvedAt timestamp should be populated');

      const statusAfter = await resultsService.getSubjectStatus(
        { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1' },
        s1UserId,
      );
      assert(statusAfter.status === 'SUBMITTED', `Expected status SUBMITTED, got ${statusAfter.status}`);
      assert(statusAfter.correctionRequired === false, 'correctionRequired should be false after resolution');
      results.push({ name: 'Test N — Resubmission resolves correction request (status = RESOLVED, resolvedAt != null)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test N — Resubmission resolves correction request (status = RESOLVED, resolvedAt != null)', passed: false, error: err.message });
    }

    // ── Test O: No duplicate SubjectResult records are created ──────────────
    try {
      const totalPhyResults = await (prisma as any).subjectResult.count({
        where: { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1' },
      });
      assert(totalPhyResults === 2, `Expected exactly 2 rows for 2 enrolled students, got ${totalPhyResults}`);
      results.push({ name: 'Test O — No duplicate SubjectResult records created across cycles', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test O — No duplicate SubjectResult records created across cycles', passed: false, error: err.message });
    }

    // ── Test P: ClassSection.status remains unchanged (ACTIVE) ──────────────
    try {
      const section = await prisma.classSection.findUnique({
        where: { id: testSectionId },
        select: { status: true },
      });
      assert(section?.status === 'ACTIVE', `ClassSection.status was mutated to ${section?.status}`);
      results.push({ name: 'Test P — ClassSection.status remains ACTIVE throughout entire workflow', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test P — ClassSection.status remains ACTIVE throughout entire workflow', passed: false, error: err.message });
    }

    // ── Test Q: Term isolation ──────────────────────────────────────────────
    try {
      // Submit Physics for TERM_2
      await resultsService.submitToHomeroom(
        {
          classSectionId: testSectionId,
          academicYearId: testYearId,
          subjectId: subPhysics,
          term: 'TERM_2',
          grades: [{ studentId: stu1Id, marks: 95 }, { studentId: stu2Id, marks: 98 }],
        },
        s1UserId,
      );

      // Return Physics for TERM_2
      await resultsService.returnSubjectResultToTeacher(
        { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_2', reason: 'Term 2 correction only' },
        hrUserId,
      );

      // Check TERM_1 is still SUBMITTED and TERM_2 is RETURNED_FOR_CORRECTION
      const t1Row = await (prisma as any).subjectResult.findFirst({
        where: { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1' },
      });
      const t2Row = await (prisma as any).subjectResult.findFirst({
        where: { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_2' },
      });

      assert(t1Row.status === 'SUBMITTED', `TERM_1 should remain SUBMITTED, got ${t1Row.status}`);
      assert(t2Row.status === 'RETURNED_FOR_CORRECTION', `TERM_2 should be RETURNED_FOR_CORRECTION, got ${t2Row.status}`);
      results.push({ name: 'Test Q — Term isolation enforced (TERM_2 return does not affect TERM_1)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test Q — Term isolation enforced (TERM_2 return does not affect TERM_1)', passed: false, error: err.message });
    }

    // ── Test R: Repeated correction requests cannot create multiple active PENDING requests ──
    try {
      // Physics TERM_2 is currently returned (has 1 PENDING request)
      // Call returnSubjectResultToTeacher again with updated note
      await resultsService.returnSubjectResultToTeacher(
        { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_2', reason: 'Updated instructions for Term 2' },
        hrUserId,
      );

      const pendingCount = await (prisma as any).subjectCorrectionRequest.count({
        where: { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_2', status: 'PENDING' },
      });
      assert(pendingCount === 1, `Expected exactly 1 PENDING request, found ${pendingCount}`);

      const latestReq = await (prisma as any).subjectCorrectionRequest.findFirst({
        where: { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_2', status: 'PENDING' },
      });
      assert(latestReq.reason === 'Updated instructions for Term 2', 'Reason was not updated');
      results.push({ name: 'Test R — Repeated correction requests reuse/update active PENDING request (no duplicates)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test R — Repeated correction requests reuse/update active PENDING request (no duplicates)', passed: false, error: err.message });
    }

    // ── Test S: Approved roster blocks direct backend grade modification ─────
    try {
      // Submit all and approve roster
      await resultsService.submitToHomeroom(
        { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_2' },
        s1UserId,
      );
      await reportsService.submitToAdmin(testSectionId, testYearId, 'roster', hrUserId);
      const rev = await (prisma as any).classRosterReview.findUnique({
        where: { classSectionId_academicYearId: { classSectionId: testSectionId, academicYearId: testYearId } },
      });
      await reportsService.approveRoster(rev.id, adminUserId);

      let editBlocked = false;
      try {
        await resultsService.saveGradesDraft(
          { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1', grades: [{ studentId: stu1Id, marks: 100 }] },
          s1UserId,
        );
      } catch (e: any) {
        if (e instanceof BadRequestException) editBlocked = true;
      }
      assert(editBlocked, 'Approved roster did not block direct backend grade draft save');
      results.push({ name: 'Test S — Approved roster blocks direct backend grade modification', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test S — Approved roster blocks direct backend grade modification', passed: false, error: err.message });
    }

    // ── Test T: Submitted-to-admin roster blocks direct backend grade modification ──
    try {
      // Reopen then submit to admin
      const rev = await (prisma as any).classRosterReview.findUnique({
        where: { classSectionId_academicYearId: { classSectionId: testSectionId, academicYearId: testYearId } },
      });
      await reportsService.reopenRoster(rev.id, adminUserId, 'Test T prep');
      await reportsService.submitToAdmin(testSectionId, testYearId, 'roster', hrUserId);

      let submitBlocked = false;
      try {
        await resultsService.submitToHomeroom(
          { classSectionId: testSectionId, academicYearId: testYearId, subjectId: subPhysics, term: 'TERM_1' },
          s1UserId,
        );
      } catch (e: any) {
        if (e instanceof BadRequestException) submitBlocked = true;
      }
      assert(submitBlocked, 'SUBMITTED_TO_ADMIN roster did not block submitToHomeroom');
      results.push({ name: 'Test T — Submitted-to-admin roster blocks direct backend grade modification', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test T — Submitted-to-admin roster blocks direct backend grade modification', passed: false, error: err.message });
    }

  } finally {
    console.log('\nCleaning up isolated Step 2 test fixtures...');
    try {
      await (prisma as any).subjectCorrectionRequest.deleteMany({ where: { classSectionId: testSectionId } });
      await (prisma as any).classRosterReview.deleteMany({ where: { classSectionId: testSectionId } });
      await (prisma as any).subjectResult.deleteMany({ where: { classSectionId: testSectionId } });
      await (prisma as any).sectionSubjectTeacher.deleteMany({ where: { classSectionId: testSectionId } });
      await prisma.studentEnrollment.deleteMany({ where: { classSectionId: testSectionId } });
      await prisma.student.deleteMany({ where: { id: { in: [stu1Id, stu2Id] } } });
      await prisma.classSection.deleteMany({ where: { id: testSectionId } });
      await prisma.subject.deleteMany({ where: { id: { in: [subPhysics, subMath, subEnglish, subChemistry] } } });
      await prisma.gradeLevel.deleteMany({ where: { id: testGradeId } });
      await prisma.teacher.deleteMany({ where: { id: { in: [hrTeacherId, s1TeacherId, s2TeacherId, otherTeacherId] } } });
      await prisma.user.deleteMany({ where: { id: { in: [hrUserId, s1UserId, s2UserId, otherUserId, adminUserId, stu1UserId, stu2UserId] } } });
      await prisma.academicYear.deleteMany({ where: { id: { in: [testYearId, testAltYearId] } } });
      console.log('Step 2 test cleanup completed successfully.');
    } catch (cleanupErr: any) {
      console.error('Cleanup error:', cleanupErr.message);
    }
  }

  // Print results
  console.log('\n====================================================');
  console.log('STEP 2 TEST EXECUTION SUMMARY');
  console.log('====================================================');
  let passedCount = 0;
  for (const r of results) {
    if (r.passed) {
      passedCount++;
      console.log(`✅ [PASS] ${r.name}`);
    } else {
      console.log(`❌ [FAIL] ${r.name} - Error: ${r.error}`);
    }
  }
  console.log('====================================================');
  console.log(`TOTAL: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================');

  await prisma.$disconnect();

  if (passedCount !== results.length) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
