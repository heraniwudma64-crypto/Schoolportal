import { PrismaClient } from '@prisma/client';
import { ReportsService } from '../modules/reports/reports.service';
import { ResultsService } from '../modules/results/results.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

const prisma = new PrismaClient();
const prismaService = prisma as unknown as PrismaService;
const reportsService = new ReportsService(prismaService);
const resultsService = new ResultsService(prismaService);

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
  console.log('STEP 1: CLASS ROSTER REVIEW WORKFLOW TEST SUITE');
  console.log('====================================================\n');

  // Test setup variables
  const suffix = Date.now().toString().slice(-6);
  const testYearId = `test-year-${suffix}`;
  const testGradeId = `test-grade-${suffix}`;
  const testSectionId = `test-sec-${suffix}`;
  const testTeacherUserId = `test-hr-user-${suffix}`;
  const testTeacherId = `test-hr-teach-${suffix}`;
  const testOtherTeacherUserId = `test-other-user-${suffix}`;
  const testOtherTeacherId = `test-other-teach-${suffix}`;
  const testAdminUserId = `test-admin-user-${suffix}`;
  const testStudentUserId = `test-stu-user-${suffix}`;
  const testStudentId = `test-stu-${suffix}`;
  const testSubjectId = `test-subj-${suffix}`;

  try {
    // 0. Setup isolated test data
    console.log('Setting up isolated test fixtures...');
    await prisma.academicYear.create({
      data: {
        id: testYearId,
        year: `2099/${suffix}`,
        startDate: new Date('2099-09-01'),
        endDate: new Date('2100-06-30'),
        isCurrent: false,
        updatedAt: new Date(),
      },
    });

    await prisma.gradeLevel.create({
      data: {
        id: testGradeId,
        name: `Grade Test ${suffix}`,
        gradeNumber: 10,
        status: 'ACTIVE',
      },
    });

    // Create Homeroom Teacher
    await prisma.user.create({
      data: {
        id: testTeacherUserId,
        loginId: `hr_teacher_${suffix}`,
        name: 'Homeroom Teacher Test',
        password: 'hashed_password',
        role: 'TEACHER',
      },
    });
    await prisma.teacher.create({
      data: {
        id: testTeacherId,
        userId: testTeacherUserId,
        firstName: 'Homeroom',
        lastName: 'Teacher',
        staffId: `HR-${suffix}`,
        updatedAt: new Date(),
      },
    });

    // Create Other Teacher
    await prisma.user.create({
      data: {
        id: testOtherTeacherUserId,
        loginId: `other_teacher_${suffix}`,
        name: 'Other Teacher Test',
        password: 'hashed_password',
        role: 'TEACHER',
      },
    });
    await prisma.teacher.create({
      data: {
        id: testOtherTeacherId,
        userId: testOtherTeacherUserId,
        firstName: 'Other',
        lastName: 'Teacher',
        staffId: `OTH-${suffix}`,
        updatedAt: new Date(),
      },
    });

    // Create Admin User
    await prisma.user.create({
      data: {
        id: testAdminUserId,
        loginId: `admin_${suffix}`,
        name: 'Admin Test',
        password: 'hashed_password',
        role: 'ADMIN',
      },
    });

    // Create Class Section with Homeroom Teacher assigned
    await prisma.classSection.create({
      data: {
        id: testSectionId,
        name: 'Section A',
        academicYearId: testYearId,
        gradeLevelId: testGradeId,
        teacherId: testTeacherId,
        status: 'ACTIVE',
      },
    });

    // Create Student & Enrollment
    await prisma.user.create({
      data: {
        id: testStudentUserId,
        loginId: `student_${suffix}`,
        name: 'Student Test',
        password: 'hashed_password',
        role: 'STUDENT',
      },
    });
    await prisma.student.create({
      data: {
        id: testStudentId,
        userId: testStudentUserId,
        admissionNo: `ADM-${suffix}`,
        firstName: 'Student',
        lastName: 'Test',
        classSectionId: testSectionId,
        updatedAt: new Date(),
      },
    });
    await prisma.studentEnrollment.create({
      data: {
        studentId: testStudentId,
        academicYearId: testYearId,
        gradeLevelId: testGradeId,
        classSectionId: testSectionId,
        status: 'ACTIVE',
      },
    });

    // Create Subject & Assign to Section
    await prisma.subject.create({
      data: {
        id: testSubjectId,
        code: `SUBJ-${suffix}`,
        name: 'Mathematics Test',
        status: 'ACTIVE',
      },
    });
    await (prisma as any).sectionSubjectTeacher.create({
      data: {
        classSectionId: testSectionId,
        subjectId: testSubjectId,
        teacherId: testTeacherId,
        academicYearId: testYearId,
      },
    });

    // Create Submitted SubjectResult so section is complete
    await (prisma as any).subjectResult.create({
      data: {
        studentId: testStudentId,
        subjectId: testSubjectId,
        classSectionId: testSectionId,
        academicYearId: testYearId,
        term: 'TERM_1',
        marks: 95,
        status: 'SUBMITTED',
      },
    });

    console.log('Test fixtures created successfully.\n');

    // ── Test A: Create Draft ────────────────────────────────────────────────
    try {
      const draftResult = await reportsService.saveRosterDraft(
        {
          classSectionId: testSectionId,
          academicYearId: testYearId,
          conductData: { [testStudentId]: 'A' },
        },
        testTeacherUserId,
      );
      assert(draftResult.success === true, 'Draft creation failed');
      assert(draftResult.review.status === 'DRAFT', 'Status is not DRAFT');
      assert(
        draftResult.review.conductData[testStudentId] === 'A',
        'Conduct data not saved',
      );
      results.push({ name: 'Test A — Create Draft (status = DRAFT)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test A — Create Draft (status = DRAFT)', passed: false, error: err.message });
    }

    // ── Test B: Unique Review ───────────────────────────────────────────────
    try {
      const secondDraft = await reportsService.saveRosterDraft(
        {
          classSectionId: testSectionId,
          academicYearId: testYearId,
          conductData: { [testStudentId]: 'B' },
        },
        testTeacherUserId,
      );
      const reviewCount = await (prisma as any).classRosterReview.count({
        where: { classSectionId: testSectionId, academicYearId: testYearId },
      });
      assert(reviewCount === 1, `Expected 1 review record, got ${reviewCount}`);
      assert(secondDraft.review.conductData[testStudentId] === 'B', 'Review was not updated');
      results.push({ name: 'Test B — Unique Review (no duplicate on resave)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test B — Unique Review (no duplicate on resave)', passed: false, error: err.message });
    }

    // ── Test C: Submit Roster (DRAFT -> SUBMITTED_TO_ADMIN) ──────────────────
    try {
      const submitReceipt = await reportsService.submitToAdmin(
        testSectionId,
        testYearId,
        'roster',
        testTeacherUserId,
      );
      assert(submitReceipt.success === true, 'Submission failed');
      assert(submitReceipt.status === 'SUBMITTED_TO_ADMIN', 'Status is not SUBMITTED_TO_ADMIN');

      const review = await (prisma as any).classRosterReview.findUnique({
        where: { classSectionId_academicYearId: { classSectionId: testSectionId, academicYearId: testYearId } },
      });
      assert(review.status === 'SUBMITTED_TO_ADMIN', 'DB status not SUBMITTED_TO_ADMIN');
      assert(review.submittedAt !== null, 'submittedAt timestamp missing');
      assert(review.submittedById === testTeacherUserId, 'submittedById mismatch');
      results.push({ name: 'Test C — Submit Roster (DRAFT -> SUBMITTED_TO_ADMIN)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test C — Submit Roster (DRAFT -> SUBMITTED_TO_ADMIN)', passed: false, error: err.message });
    }

    // ── Test E: ClassSection Status Unchanged (ACTIVE) ──────────────────────
    try {
      const section = await prisma.classSection.findUnique({
        where: { id: testSectionId },
        select: { status: true },
      });
      assert(section?.status === 'ACTIVE', `ClassSection.status mutated to '${section?.status}', expected 'ACTIVE'`);
      results.push({ name: 'Test E — ClassSection.status remains ACTIVE after submission', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test E — ClassSection.status remains ACTIVE after submission', passed: false, error: err.message });
    }

    // ── Test F: Wrong Homeroom Teacher Cannot Submit/Draft ──────────────────
    try {
      let threwForbidden = false;
      try {
        await reportsService.submitToAdmin(
          testSectionId,
          testYearId,
          'roster',
          testOtherTeacherUserId,
        );
      } catch (e: any) {
        if (e instanceof ForbiddenException) threwForbidden = true;
      }
      assert(threwForbidden, 'Non-homeroom teacher was not rejected with ForbiddenException');
      results.push({ name: 'Test F — Wrong Homeroom Teacher rejected (403 Forbidden)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test F — Wrong Homeroom Teacher rejected (403 Forbidden)', passed: false, error: err.message });
    }

    // ── Test H: Admin Rejection (SUBMITTED_TO_ADMIN -> REJECTED) ────────────
    let reviewId = '';
    try {
      const review = await (prisma as any).classRosterReview.findUnique({
        where: { classSectionId_academicYearId: { classSectionId: testSectionId, academicYearId: testYearId } },
      });
      reviewId = review.id;

      const rejectResult = await reportsService.rejectRoster(
        reviewId,
        testAdminUserId,
        'Math scores require verification',
      );
      assert(rejectResult.review.status === 'REJECTED', 'Status is not REJECTED');
      assert(
        rejectResult.review.rejectionReason === 'Math scores require verification',
        'Rejection reason not stored',
      );
      assert(rejectResult.review.reviewedById === testAdminUserId, 'reviewedById mismatch');
      results.push({ name: 'Test H — Admin Rejection (SUBMITTED_TO_ADMIN -> REJECTED with reason)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test H — Admin Rejection (SUBMITTED_TO_ADMIN -> REJECTED with reason)', passed: false, error: err.message });
    }

    // ── Test I: Empty Rejection Reason Rejected ────────────────────────────
    try {
      let threwEmpty = false;
      try {
        await reportsService.rejectRoster(reviewId, testAdminUserId, '   ');
      } catch (e: any) {
        if (e instanceof BadRequestException) threwEmpty = true;
      }
      assert(threwEmpty, 'Whitespace-only rejection reason was not rejected');
      results.push({ name: 'Test I — Empty Rejection Reason rejected', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test I — Empty Rejection Reason rejected', passed: false, error: err.message });
    }

    // ── Test D: Rejected Resubmission (REJECTED -> SUBMITTED_TO_ADMIN) ──────
    try {
      const resubmitReceipt = await reportsService.submitToAdmin(
        testSectionId,
        testYearId,
        'roster',
        testTeacherUserId,
      );
      assert(resubmitReceipt.status === 'SUBMITTED_TO_ADMIN', 'Status is not SUBMITTED_TO_ADMIN');
      const updatedReview = await (prisma as any).classRosterReview.findUnique({
        where: { id: reviewId },
      });
      assert(updatedReview.rejectionReason === null, 'Rejection reason was not cleared on resubmission');
      results.push({ name: 'Test D — Rejected Resubmission (REJECTED -> SUBMITTED_TO_ADMIN, cleared reason)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test D — Rejected Resubmission (REJECTED -> SUBMITTED_TO_ADMIN, cleared reason)', passed: false, error: err.message });
    }

    // ── Test G: Admin Approval (SUBMITTED_TO_ADMIN -> APPROVED) ────────────
    try {
      const approveResult = await reportsService.approveRoster(reviewId, testAdminUserId);
      assert(approveResult.review.status === 'APPROVED', 'Status is not APPROVED');
      assert(approveResult.review.reviewedAt !== null, 'reviewedAt timestamp missing');
      assert(approveResult.review.reviewedById === testAdminUserId, 'reviewedById mismatch');
      results.push({ name: 'Test G — Admin Approval (SUBMITTED_TO_ADMIN -> APPROVED)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test G — Admin Approval (SUBMITTED_TO_ADMIN -> APPROVED)', passed: false, error: err.message });
    }

    // ── Test J: Invalid Approval (Cannot approve APPROVED or DRAFT) ─────────
    try {
      let threwInvalidApproval = false;
      try {
        await reportsService.approveRoster(reviewId, testAdminUserId);
      } catch (e: any) {
        if (e instanceof BadRequestException) threwInvalidApproval = true;
      }
      assert(threwInvalidApproval, 'Attempt to approve already approved roster did not throw BadRequestException');
      results.push({ name: 'Test J — Invalid Approval rejected (already approved)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test J — Invalid Approval rejected (already approved)', passed: false, error: err.message });
    }

    // ── Test K: Invalid Rejection (Cannot reject APPROVED) ──────────────────
    try {
      let threwInvalidReject = false;
      try {
        await reportsService.rejectRoster(reviewId, testAdminUserId, 'Some reason');
      } catch (e: any) {
        if (e instanceof BadRequestException) threwInvalidReject = true;
      }
      assert(threwInvalidReject, 'Attempt to reject approved roster did not throw BadRequestException');
      results.push({ name: 'Test K — Invalid Rejection rejected (cannot reject approved roster)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test K — Invalid Rejection rejected (cannot reject approved roster)', passed: false, error: err.message });
    }

    // ── Test N: Approved Lock (Results editing blocked) ─────────────────────
    try {
      let threwLockException = false;
      try {
        await resultsService.saveGradesDraft(
          {
            classSectionId: testSectionId,
            subjectId: testSubjectId,
            academicYearId: testYearId,
            term: 'TERM_1',
            grades: [{ studentId: testStudentId, marks: 80 }],
          },
          testTeacherUserId,
        );
      } catch (e: any) {
        if (e instanceof BadRequestException && e.message.includes('locked for editing')) {
          threwLockException = true;
        }
      }
      assert(threwLockException, 'Editing results for an approved roster was not blocked with lock exception');
      results.push({ name: 'Test N — Approved Lock (Grade editing blocked when roster is APPROVED)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test N — Approved Lock (Grade editing blocked when roster is APPROVED)', passed: false, error: err.message });
    }

    // ── Test L: Reopen Approved Roster (APPROVED -> DRAFT) ──────────────────
    try {
      const reopenResult = await reportsService.reopenRoster(
        reviewId,
        testAdminUserId,
        'Correction requested by principal',
      );
      assert(reopenResult.review.status === 'DRAFT', 'Status is not DRAFT after reopen');
      assert(reopenResult.review.reviewedAt === null, 'reviewedAt was not cleared');
      assert(reopenResult.review.reviewedById === null, 'reviewedById was not cleared');
      assert(
        reopenResult.review.rejectionReason.includes('Correction requested by principal'),
        'Reopen audit text not recorded',
      );
      results.push({ name: 'Test L — Reopen Approved (APPROVED -> DRAFT with audit reason)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test L — Reopen Approved (APPROVED -> DRAFT with audit reason)', passed: false, error: err.message });
    }

    // ── Test M: Invalid Reopen (Cannot reopen DRAFT) ────────────────────────
    try {
      let threwInvalidReopen = false;
      try {
        await reportsService.reopenRoster(reviewId, testAdminUserId, 'Another reason');
      } catch (e: any) {
        if (e instanceof BadRequestException) threwInvalidReopen = true;
      }
      assert(threwInvalidReopen, 'Attempt to reopen DRAFT did not throw BadRequestException');
      results.push({ name: 'Test M — Invalid Reopen rejected (cannot reopen DRAFT)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test M — Invalid Reopen rejected (cannot reopen DRAFT)', passed: false, error: err.message });
    }

    // ── Test O: Academic Year Isolation ────────────────────────────────────
    try {
      let threwIsolation = false;
      try {
        await reportsService.submitToAdmin(
          testSectionId,
          'wrong-academic-year-id',
          'roster',
          testTeacherUserId,
        );
      } catch (e: any) {
        if (e instanceof BadRequestException) threwIsolation = true;
      }
      assert(threwIsolation, 'Mismatched academicYearId did not throw BadRequestException');
      results.push({ name: 'Test O — Academic Year Isolation enforced', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test O — Academic Year Isolation enforced', passed: false, error: err.message });
    }

    // ── Test P: Full Sequence No ClassSection Mutation ─────────────────────
    try {
      // Current state: DRAFT
      let sec = await prisma.classSection.findUnique({ where: { id: testSectionId }, select: { status: true } });
      assert(sec?.status === 'ACTIVE', `State 1 DRAFT: status is ${sec?.status}`);

      // -> SUBMITTED_TO_ADMIN
      await reportsService.submitToAdmin(testSectionId, testYearId, 'roster', testTeacherUserId);
      sec = await prisma.classSection.findUnique({ where: { id: testSectionId }, select: { status: true } });
      assert(sec?.status === 'ACTIVE', `State 2 SUBMITTED: status is ${sec?.status}`);

      // -> REJECTED
      await reportsService.rejectRoster(reviewId, testAdminUserId, 'Need edit');
      sec = await prisma.classSection.findUnique({ where: { id: testSectionId }, select: { status: true } });
      assert(sec?.status === 'ACTIVE', `State 3 REJECTED: status is ${sec?.status}`);

      // -> SUBMITTED_TO_ADMIN
      await reportsService.submitToAdmin(testSectionId, testYearId, 'roster', testTeacherUserId);
      sec = await prisma.classSection.findUnique({ where: { id: testSectionId }, select: { status: true } });
      assert(sec?.status === 'ACTIVE', `State 4 RESUBMITTED: status is ${sec?.status}`);

      // -> APPROVED
      await reportsService.approveRoster(reviewId, testAdminUserId);
      sec = await prisma.classSection.findUnique({ where: { id: testSectionId }, select: { status: true } });
      assert(sec?.status === 'ACTIVE', `State 5 APPROVED: status is ${sec?.status}`);

      // -> DRAFT (Reopen)
      await reportsService.reopenRoster(reviewId, testAdminUserId, 'Final reopen check');
      sec = await prisma.classSection.findUnique({ where: { id: testSectionId }, select: { status: true } });
      assert(sec?.status === 'ACTIVE', `State 6 REOPENED: status is ${sec?.status}`);

      results.push({ name: 'Test P — Full Cycle No ClassSection Mutation (DRAFT->SUBMIT->REJECT->SUBMIT->APPROVE->DRAFT)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test P — Full Cycle No ClassSection Mutation', passed: false, error: err.message });
    }

    // ── Security Test: Credentials never leaked in getRosterStatus ─────────
    try {
      const statusData = await reportsService.getRosterStatus(
        testSectionId,
        testYearId,
        testAdminUserId,
        'ADMIN',
      );
      assert(statusData !== null, 'Status data returned null');
      const jsonString = JSON.stringify(statusData);
      assert(!jsonString.includes('password'), 'Password leaked in status response');
      assert(!jsonString.includes('otpCode'), 'OTP leaked in status response');
      assert(!jsonString.includes('resetOtp'), 'Reset OTP leaked in status response');
      results.push({ name: 'Security Test — No credentials/tokens leaked in status response', passed: true });
    } catch (err: any) {
      results.push({ name: 'Security Test — No credentials/tokens leaked in status response', passed: false, error: err.message });
    }

  } finally {
    // Cleanup isolated test fixtures
    console.log('\nCleaning up isolated test fixtures...');
    try {
      await (prisma as any).classRosterReview.deleteMany({ where: { classSectionId: testSectionId } });
      await (prisma as any).subjectResult.deleteMany({ where: { classSectionId: testSectionId } });
      await (prisma as any).sectionSubjectTeacher.deleteMany({ where: { classSectionId: testSectionId } });
      await prisma.studentEnrollment.deleteMany({ where: { classSectionId: testSectionId } });
      await prisma.student.deleteMany({ where: { id: testStudentId } });
      await prisma.classSection.deleteMany({ where: { id: testSectionId } });
      await prisma.subject.deleteMany({ where: { id: testSubjectId } });
      await prisma.gradeLevel.deleteMany({ where: { id: testGradeId } });
      await prisma.teacher.deleteMany({ where: { id: { in: [testTeacherId, testOtherTeacherId] } } });
      await prisma.user.deleteMany({ where: { id: { in: [testTeacherUserId, testOtherTeacherUserId, testAdminUserId, testStudentUserId] } } });
      await prisma.academicYear.deleteMany({ where: { id: testYearId } });
      console.log('Cleanup completed successfully.');
    } catch (cleanupErr: any) {
      console.error('Cleanup error:', cleanupErr.message);
    }
  }

  // Print results
  console.log('\n====================================================');
  console.log('TEST EXECUTION SUMMARY');
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
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
