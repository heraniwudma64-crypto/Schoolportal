import { PrismaClient } from '@prisma/client';
import { CalculationService } from '../modules/results/calculation.service';
import { ReportsService } from '../modules/reports/reports.service';
import { ReportsController } from '../modules/reports/reports.controller';
import { ResultsService } from '../modules/results/results.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

const prisma = new PrismaClient();
const prismaService = prisma as unknown as PrismaService;
const calculationService = new CalculationService(prismaService);
const reportsService = new ReportsService(prismaService, calculationService);
const reportsController = new ReportsController(reportsService);
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

async function runStep6Tests() {
  console.log('====================================================');
  console.log('STEP 6: ADMIN ROSTER REVIEW WORKFLOW TEST SUITE');
  console.log('====================================================\n');

  const suffix = Date.now().toString().slice(-6);
  const testYear1Id = `yr1-r-${suffix}`;
  const testYear2Id = `yr2-r-${suffix}`;
  const testGradeId = `grd-r-${suffix}`;
  const testSectionAId = `sec-a-r-${suffix}`;
  const testSectionBId = `sec-b-r-${suffix}`;

  const hrTeacherUserId = `u-hr-r-${suffix}`;
  const hrTeacherId = `t-hr-r-${suffix}`;
  const otherTeacherUserId = `u-oth-r-${suffix}`;
  const otherTeacherId = `t-oth-r-${suffix}`;
  const adminUserId = `u-adm-r-${suffix}`;

  const subMath = `sub-mat-r-${suffix}`;
  const subEng = `sub-eng-r-${suffix}`;

  const stu1Id = `stu-1-r-${suffix}`;
  const stu2Id = `stu-2-r-${suffix}`;
  const stu3Id = `stu-3-r-${suffix}`;

  try {
    console.log('Setting up isolated Step 6 fixtures...');

    // 1. Users
    await prisma.user.createMany({
      data: [
        { id: hrTeacherUserId, loginId: `hr_r_${suffix}`, password: 'hash_secret_123', role: 'TEACHER', name: 'Homeroom Review Teacher' },
        { id: otherTeacherUserId, loginId: `oth_r_${suffix}`, password: 'hash_secret_456', role: 'TEACHER', name: 'Other Review Teacher' },
        { id: adminUserId, loginId: `adm_r_${suffix}`, password: 'hash_secret_789', role: 'ADMIN', name: 'Administrator Review' },
        { id: `u-stu1-r-${suffix}`, loginId: `stu1_r_${suffix}`, password: 'hash_secret_abc', role: 'STUDENT', name: 'Student One' },
        { id: `u-stu2-r-${suffix}`, loginId: `stu2_r_${suffix}`, password: 'hash_secret_def', role: 'STUDENT', name: 'Student Two' },
        { id: `u-stu3-r-${suffix}`, loginId: `stu3_r_${suffix}`, password: 'hash_secret_ghi', role: 'STUDENT', name: 'Student Three' },
      ],
    });

    // 2. Teachers
    await prisma.teacher.createMany({
      data: [
        { id: hrTeacherId, userId: hrTeacherUserId, firstName: 'Homeroom', lastName: 'Reviewer', staffId: `STF-HR-R-${suffix}`, updatedAt: new Date() },
        { id: otherTeacherId, userId: otherTeacherUserId, firstName: 'Other', lastName: 'Teacher', staffId: `STF-OTH-R-${suffix}`, updatedAt: new Date() },
      ],
    });

    // 3. Academic Years
    await prisma.academicYear.createMany({
      data: [
        { id: testYear1Id, year: `2025/2026-R1-${suffix}`, startDate: new Date('2025-09-01'), endDate: new Date('2026-06-30'), isCurrent: true, updatedAt: new Date() },
        { id: testYear2Id, year: `2026/2027-R2-${suffix}`, startDate: new Date('2026-09-01'), endDate: new Date('2027-06-30'), isCurrent: false, updatedAt: new Date() },
      ],
    });

    // 4. Grade Level
    await prisma.gradeLevel.create({
      data: { id: testGradeId, name: `Grade 10-R-${suffix}`, gradeNumber: 10, status: 'ACTIVE' },
    });

    // 5. Class Sections (Must remain ACTIVE throughout)
    await prisma.classSection.createMany({
      data: [
        { id: testSectionAId, name: 'TEST Section A', academicYearId: testYear1Id, gradeLevelId: testGradeId, teacherId: hrTeacherId, status: 'ACTIVE', capacity: 30, updatedAt: new Date() },
        { id: testSectionBId, name: 'TEST Section B', academicYearId: testYear1Id, gradeLevelId: testGradeId, teacherId: otherTeacherId, status: 'ACTIVE', capacity: 30, updatedAt: new Date() },
      ],
    });

    // 6. Subjects
    await prisma.subject.createMany({
      data: [
        { id: subMath, name: `Mathematics R-${suffix}`, code: `MTH-R-${suffix}`, status: 'ACTIVE' },
        { id: subEng, name: `English R-${suffix}`, code: `ENG-R-${suffix}`, status: 'ACTIVE' },
      ],
    });

    // 7. Section Subject Teachers
    await (prisma as any).sectionSubjectTeacher.createMany({
      data: [
        { classSectionId: testSectionAId, subjectId: subMath, teacherId: hrTeacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionAId, subjectId: subEng, teacherId: hrTeacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionBId, subjectId: subMath, teacherId: otherTeacherId, academicYearId: testYear1Id },
      ],
    });

    // 8. Students
    await prisma.student.createMany({
      data: [
        { id: stu1Id, userId: `u-stu1-r-${suffix}`, admissionNo: `ADM-R1-${suffix}`, firstName: 'Alice', lastName: 'Review', gender: 'FEMALE', status: 'ACTIVE', updatedAt: new Date() },
        { id: stu2Id, userId: `u-stu2-r-${suffix}`, admissionNo: `ADM-R2-${suffix}`, firstName: 'Bob', lastName: 'Review', gender: 'MALE', status: 'ACTIVE', updatedAt: new Date() },
        { id: stu3Id, userId: `u-stu3-r-${suffix}`, admissionNo: `ADM-R3-${suffix}`, firstName: 'Charlie', lastName: 'Review', gender: 'MALE', status: 'ACTIVE', updatedAt: new Date() },
      ],
    });

    // 9. Student Enrollments
    await prisma.studentEnrollment.createMany({
      data: [
        { studentId: stu1Id, classSectionId: testSectionAId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' },
        { studentId: stu2Id, classSectionId: testSectionAId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' },
        { studentId: stu3Id, classSectionId: testSectionAId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' },
      ],
    });

    // Helper to seed all marks
    const seedMarks = async () => {
      await (prisma as any).subjectResult.deleteMany({ where: { classSectionId: testSectionAId } });
      const terms = ['TERM_1', 'TERM_2', 'TERM_3', 'TERM_4'];
      const students = [stu1Id, stu2Id, stu3Id];
      const subjects = [subMath, subEng];
      const marksData: any[] = [];

      for (const stu of students) {
        for (const sub of subjects) {
          for (const term of terms) {
            marksData.push({
              studentId: stu,
              subjectId: sub,
              classSectionId: testSectionAId,
              academicYearId: testYear1Id,
              term,
              marks: stu === stu1Id ? 90 : stu === stu2Id ? 80 : 70,
              status: 'SUBMITTED',
            });
          }
        }
      }
      await (prisma as any).subjectResult.createMany({ data: marksData });
    };

    await seedMarks();

    // Helper test runner
    async function test(name: string, fn: () => Promise<void>) {
      try {
        await fn();
        results.push({ name, passed: true });
        console.log(`✅ [PASS] ${name}`);
      } catch (err: any) {
        results.push({ name, passed: false, error: err?.message });
        console.log(`❌ [FAIL] ${name} — ${err?.message}`);
      }
    }

    console.log('Fixtures initialized. Executing Step 6 tests...\n');

    let reviewId = '';

    // Seed draft review with conduct
    const initDraft = await reportsService.saveConduct(
      {
        classSectionId: testSectionAId,
        academicYearId: testYear1Id,
        conductData: { [stu1Id]: 'A', [stu2Id]: 'B', [stu3Id]: 'C' },
      },
      hrTeacherUserId,
    );
    reviewId = initDraft.reviewId;

    // Test D — Cannot approve DRAFT
    await test('Test D — Cannot approve DRAFT', async () => {
      let err: any = null;
      try {
        await reportsService.approveRoster(reviewId, adminUserId);
      } catch (e) {
        err = e;
      }
      assert(err instanceof BadRequestException, 'Should throw BadRequestException when approving DRAFT');
      assert(err.message.includes("Only rosters in 'SUBMITTED_TO_ADMIN' status can be approved"), 'Expected message');
    });

    // Test E1 — Cannot reject DRAFT
    await test('Test E1 — Cannot reject DRAFT', async () => {
      let err: any = null;
      try {
        await reportsService.rejectRoster(reviewId, adminUserId, 'Some reason');
      } catch (e) {
        err = e;
      }
      assert(err instanceof BadRequestException, 'Should throw BadRequestException when rejecting DRAFT');
    });

    // Test O1 — DRAFT cannot be printed
    await test('Test O1 — DRAFT cannot be printed', async () => {
      let err: any = null;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, adminUserId, 'ADMIN');
      } catch (e) {
        err = e;
      }
      assert(err instanceof BadRequestException, 'Should block printing for DRAFT');
    });

    // Submit roster to Admin
    const subRes = await reportsService.submitToAdmin(testSectionAId, testYear1Id, 'roster', hrTeacherUserId);
    assert(subRes.status === 'SUBMITTED_TO_ADMIN', 'Roster should be submitted');

    // Test A — Admin sees submitted roster in review queue and summary
    await test('Test A — Admin sees submitted roster', async () => {
      const queue = await reportsService.getRosterReviews({ status: 'SUBMITTED_TO_ADMIN' });
      const found = queue.find((q) => q.reviewId === reviewId);
      assert(!!found, 'Submitted roster must appear in Admin review queue');
      assert(found?.status === 'SUBMITTED_TO_ADMIN', 'Status must be SUBMITTED_TO_ADMIN');
      assert(found?.enrolledCount === 3, 'Enrolled count should be 3');
      assert(found?.conductCompleted === 3, 'Conduct completed count should be 3');
      assert(found?.conductCompletion === 'complete', 'Conduct completion should be complete');
      assert(found?.subjectCompletion === 'complete', 'Subject completion should be complete');

      const summary = await reportsService.getAdminSectionsSummary(testYear1Id);
      const secSummary = summary.find((s) => s.id === testSectionAId);
      assert(secSummary?.reviewStatus === 'SUBMITTED_TO_ADMIN', 'Summary reviewStatus must be SUBMITTED_TO_ADMIN');
      assert(secSummary?.conductStatus === 'complete', 'Summary conductStatus must be complete');
      assert(secSummary?.submittedAt !== null, 'Summary submittedAt must be populated');
    });

    // Test B — Admin sees full roster (authoritative calculation data)
    await test('Test B — Admin sees full roster', async () => {
      const fullRoster = await reportsService.getFullSectionRoster(testSectionAId, testYear1Id);
      assert(fullRoster.students.length === 3, 'Full roster should contain 3 students');
      assert(fullRoster.subjects.length === 2, 'Full roster should contain 2 dynamic subjects');
      assert(fullRoster.terms.length === 4, 'Full roster should contain 4 terms');
      
      const s1 = fullRoster.students.find((s: any) => s.studentId === stu1Id);
      assert(s1?.conduct === 'A', 'Conduct A should be attached to student 1');
      assert(s1?.isComplete === true, 'Student 1 should be complete');
      assert(s1?.sum === 180, 'Student 1 sum should be 180');
      assert(s1?.average === 90, 'Student 1 average should be 90');
      assert(s1?.rank === 1, 'Student 1 rank should be 1');
    });

    // Test G — Admin rejection requires reason
    await test('Test G — Admin rejection requires reason', async () => {
      let err: any = null;
      try {
        await reportsService.rejectRoster(reviewId, adminUserId, '   ');
      } catch (e) {
        err = e;
      }
      assert(err instanceof BadRequestException, 'Should throw BadRequestException on empty rejection reason');
    });

    // Test H — Admin can reject submitted roster (SUBMITTED_TO_ADMIN → REJECTED)
    await test('Test H — Admin can reject submitted roster', async () => {
      const rejRes = await reportsService.rejectRoster(
        reviewId,
        adminUserId,
        'Please correct the missing Physics mark for Student 002.',
      );
      assert(rejRes.review.status === 'REJECTED', 'Status should be REJECTED');
      assert(
        rejRes.review.rejectionReason === 'Please correct the missing Physics mark for Student 002.',
        'Rejection reason must match',
      );
    });

    // Test I — Rejection reason persists in database and status queries
    await test('Test I — Rejection reason persists', async () => {
      const status = await reportsService.getRosterStatus(testSectionAId, testYear1Id);
      assert(status.status === 'REJECTED', 'Status should be REJECTED');
      assert(
        status.rejectionReason === 'Please correct the missing Physics mark for Student 002.',
        'Rejection reason should persist',
      );
    });

    // Test J — Homeroom sees rejection reason
    await test('Test J — Homeroom sees rejection reason', async () => {
      const status = await reportsService.getRosterStatus(testSectionAId, testYear1Id, hrTeacherUserId, 'TEACHER');
      assert(status.status === 'REJECTED', 'Homeroom sees status REJECTED');
      assert(
        status.rejectionReason === 'Please correct the missing Physics mark for Student 002.',
        'Homeroom sees exact rejection reason',
      );
    });

    // Test E — Cannot approve REJECTED
    await test('Test E — Cannot approve REJECTED', async () => {
      let err: any = null;
      try {
        await reportsService.approveRoster(reviewId, adminUserId);
      } catch (e) {
        err = e;
      }
      assert(err instanceof BadRequestException, 'Should reject approve on REJECTED roster');
      assert(err.message.includes("Cannot approve roster with status 'REJECTED'"), 'Expected message');
    });

    // Test O2 — REJECTED cannot be printed
    await test('Test O2 — REJECTED cannot be printed', async () => {
      let err: any = null;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, adminUserId, 'ADMIN');
      } catch (e) {
        err = e;
      }
      assert(err instanceof BadRequestException, 'Should block printing for REJECTED');
    });

    // Test K — Rejected roster can be resubmitted (REJECTED → SUBMITTED_TO_ADMIN)
    await test('Test K — Rejected roster can be resubmitted', async () => {
      const resub = await reportsService.submitToAdmin(testSectionAId, testYear1Id, 'roster', hrTeacherUserId);
      assert(resub.status === 'SUBMITTED_TO_ADMIN', 'Resubmitted status should be SUBMITTED_TO_ADMIN');
    });

    // Test L — Rejection reason clears/updates correctly on resubmission
    await test('Test L — Rejection reason clears on resubmission', async () => {
      const status = await reportsService.getRosterStatus(testSectionAId, testYear1Id);
      assert(status.status === 'SUBMITTED_TO_ADMIN', 'Status is SUBMITTED_TO_ADMIN');
      assert(status.rejectionReason === null, 'Rejection reason must be null after resubmission');
    });

    // Test AB — No duplicate review records on resubmission
    await test('Test AB — No duplicate review records on resubmission', async () => {
      const count = await (prisma as any).classRosterReview.count({
        where: { classSectionId: testSectionAId, academicYearId: testYear1Id },
      });
      assert(count === 1, `Expected exactly 1 review record, got ${count}`);
    });

    // Test C — Correct Admin can approve (SUBMITTED_TO_ADMIN → APPROVED)
    await test('Test C — Correct Admin can approve', async () => {
      const appRes = await reportsService.approveRoster(reviewId, adminUserId);
      assert(appRes.review.status === 'APPROVED', 'Status should be APPROVED');
      assert(appRes.review.reviewedById === adminUserId, 'reviewedById must be admin user');
      assert(appRes.review.reviewedAt !== null, 'reviewedAt must be set');
      assert(appRes.review.rejectionReason === null, 'rejectionReason must be null');
    });

    // Test F — Cannot approve APPROVED
    await test('Test F — Cannot approve APPROVED', async () => {
      let err: any = null;
      try {
        await reportsService.approveRoster(reviewId, adminUserId);
      } catch (e) {
        err = e;
      }
      assert(err instanceof BadRequestException, 'Should throw BadRequestException when approving already APPROVED roster');
    });

    // Test M — Approved roster is locked (direct modification attempts fail)
    await test('Test M — Approved roster is locked', async () => {
      let errDraft: any = null;
      try {
        await reportsService.saveRosterDraft({ classSectionId: testSectionAId, academicYearId: testYear1Id }, hrTeacherUserId);
      } catch (e) {
        errDraft = e;
      }
      assert(errDraft instanceof BadRequestException, 'Saving draft must fail when APPROVED');

      let errConduct: any = null;
      try {
        await reportsService.saveConduct(
          { classSectionId: testSectionAId, academicYearId: testYear1Id, conductData: { [stu1Id]: 'B' } },
          hrTeacherUserId,
        );
      } catch (e) {
        errConduct = e;
      }
      assert(errConduct instanceof BadRequestException, 'Saving conduct must fail when APPROVED');
    });

    // Test N — Approved roster can be printed
    await test('Test N — Approved roster can be printed', async () => {
      const printData = await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, adminUserId, 'ADMIN');
      assert(!!printData.officialHeader, 'Official header must be returned');
      assert(printData.officialHeader.status === 'APPROVED', 'Header status must be APPROVED');
      assert(printData.students.length === 3, 'Should return all 3 students');
      assert(printData.paperRows.length === 3, 'Paper rows should contain 3 student groups');
      const totalRows = printData.paperRows.reduce((acc: number, g: any) => acc + g.periods.length, 0);
      assert(totalRows === 21, `Paper rows should contain 21 academic period rows, got ${totalRows}`);
    });

    // Test P, Q, R — Authorization: Only Admin can approve, reject, reopen
    await test('Test P — Only Admin can approve (Teacher rejected by controller role decorator)', async () => {
      // In NestJS controller, @Roles(Role.ADMIN) protects approve, reject, reopen
      // We verify the controller decorator metadata
      const rolesApprove = Reflect.getMetadata('roles', ReportsController.prototype.approveRoster);
      assert(JSON.stringify(rolesApprove) === JSON.stringify(['ADMIN']), 'approveRoster must be restricted to ADMIN');
    });

    await test('Test Q — Only Admin can reject (Teacher rejected by controller role decorator)', async () => {
      const rolesReject = Reflect.getMetadata('roles', ReportsController.prototype.rejectRoster);
      assert(JSON.stringify(rolesReject) === JSON.stringify(['ADMIN']), 'rejectRoster must be restricted to ADMIN');
    });

    await test('Test R — Only Admin can reopen (Teacher rejected by controller role decorator)', async () => {
      const rolesReopen = Reflect.getMetadata('roles', ReportsController.prototype.reopenRoster);
      assert(JSON.stringify(rolesReopen) === JSON.stringify(['ADMIN']), 'reopenRoster must be restricted to ADMIN');
    });

    // Test S — Reopen requires reason
    await test('Test S — Reopen requires reason', async () => {
      let err: any = null;
      try {
        await reportsService.reopenRoster(reviewId, adminUserId, '   ');
      } catch (e) {
        err = e;
      }
      assert(err instanceof BadRequestException, 'Should throw BadRequestException on empty reopen reason');
    });

    // Test T — Approved roster can be reopened (APPROVED → DRAFT)
    await test('Test T — Approved roster can be reopened', async () => {
      const reopenRes = await reportsService.reopenRoster(
        reviewId,
        adminUserId,
        'Correction required after administrative review',
      );
      assert(reopenRes.review.status === 'DRAFT', 'Status should be DRAFT after reopening');
      assert(reopenRes.review.reviewedAt === null, 'reviewedAt should be reset to null');
      assert(reopenRes.review.reviewedById === null, 'reviewedById should be reset to null');
      assert(
        reopenRes.review.rejectionReason === 'Reopened by admin: Correction required after administrative review',
        'Reopen reason should be recorded in audit log',
      );
    });

    // Test U — Reopened roster cannot be printed
    await test('Test U — Reopened roster cannot be printed', async () => {
      let err: any = null;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, adminUserId, 'ADMIN');
      } catch (e) {
        err = e;
      }
      assert(err instanceof BadRequestException, 'Print must be locked when reopened to DRAFT');
      assert(err.message.includes('Official print is locked'), 'Expected lock error message');
    });

    // Test V — Reopened roster allows conduct editing
    await test('Test V — Reopened roster allows conduct editing', async () => {
      const condRes = await reportsService.saveConduct(
        {
          classSectionId: testSectionAId,
          academicYearId: testYear1Id,
          conductData: { [stu1Id]: 'B', [stu2Id]: 'B', [stu3Id]: 'A' },
        },
        hrTeacherUserId,
      );
      assert(condRes.success === true, 'Conduct saving must succeed in DRAFT');
      assert(condRes.conductData[stu1Id] === 'B', 'Updated conduct B should be persisted');
    });

    // Test W — Reopened roster allows permitted corrections
    await test('Test W — Reopened roster allows permitted corrections', async () => {
      const draftRes = await reportsService.saveRosterDraft(
        { classSectionId: testSectionAId, academicYearId: testYear1Id },
        hrTeacherUserId,
      );
      assert(draftRes.success === true, 'Draft saving must succeed in reopened DRAFT');
    });

    // Test X — ClassSection.status remains ACTIVE throughout entire workflow
    await test('Test X — ClassSection.status remains ACTIVE', async () => {
      const secA = await prisma.classSection.findUnique({ where: { id: testSectionAId } });
      assert(secA?.status === 'ACTIVE', `ClassSection.status must be ACTIVE, got ${secA?.status}`);
    });

    // Test Y — Section isolation (unrelated section data not leaked)
    await test('Test Y — Section isolation', async () => {
      const secBRoster = await reportsService.getFullSectionRoster(testSectionBId, testYear1Id);
      assert(secBRoster.students.length === 0, 'Section B should have 0 students');
      assert(secBRoster.section.id === testSectionBId, 'Section B ID matches');

      let errPrintB: any = null;
      try {
        await reportsService.getOfficialPrintRoster(testSectionBId, testYear1Id, adminUserId, 'ADMIN');
      } catch (e) {
        errPrintB = e;
      }
      assert(errPrintB instanceof BadRequestException, 'Section B cannot print unapproved roster');
    });

    // Test Z — Academic year isolation
    await test('Test Z — Academic year isolation', async () => {
      let errYear: any = null;
      try {
        await reportsService.getFullSectionRoster(testSectionAId, testYear2Id);
      } catch (e) {
        errYear = e;
      }
      assert(errYear instanceof BadRequestException, 'Mismatched academic year must be rejected');
      assert(errYear.message.includes('does not belong to the selected academic year'), 'Expected year mismatch error');
    });

    // Test AA — No sensitive data leakage (no passwords, hashes, tokens, secrets)
    await test('Test AA — No sensitive data leakage', async () => {
      const reviews = await reportsService.getRosterReviews();
      const stringified = JSON.stringify(reviews);
      assert(!stringified.includes('password'), 'Response must not contain password key');
      assert(!stringified.includes('hash_secret'), 'Response must not leak password hashes');
      assert(!stringified.includes('secret'), 'Response must not contain secret tokens');
    });

    // Test AC — Audit metadata accurately updated
    await test('Test AC — Audit metadata accurately updated', async () => {
      // Resubmit then approve again to check audit timestamps
      await reportsService.submitToAdmin(testSectionAId, testYear1Id, 'roster', hrTeacherUserId);
      const app2 = await reportsService.approveRoster(reviewId, adminUserId);
      assert(app2.review.submittedAt !== null, 'submittedAt must be present');
      assert(app2.review.submittedById === hrTeacherUserId, 'submittedById must match homeroom teacher user');
      assert(app2.review.reviewedAt !== null, 'reviewedAt must be present');
      assert(app2.review.reviewedById === adminUserId, 'reviewedById must match admin user');
    });

    // Test AD — Conduct preserved across transitions
    await test('Test AD — Conduct preserved across transitions', async () => {
      const full = await reportsService.getFullSectionRoster(testSectionAId, testYear1Id);
      const s1 = full.students.find((s: any) => s.studentId === stu1Id);
      const s2 = full.students.find((s: any) => s.studentId === stu2Id);
      const s3 = full.students.find((s: any) => s.studentId === stu3Id);
      assert(s1?.conduct === 'B', 'Student 1 conduct B preserved');
      assert(s2?.conduct === 'B', 'Student 2 conduct B preserved');
      assert(s3?.conduct === 'A', 'Student 3 conduct A preserved');
    });

    // Test AE — Calculation integrity matches CalculationService
    await test('Test AE — Calculation integrity', async () => {
      const calcData = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const full = await reportsService.getFullSectionRoster(testSectionAId, testYear1Id);
      assert(JSON.stringify(calcData.statistics) === JSON.stringify(full.statistics), 'Statistics must match CalculationService exactly');
      assert(calcData.students.length === full.students.length, 'Student length must match CalculationService exactly');
      assert(calcData.students[0].sum === full.students[0].sum, 'Student sums must match CalculationService exactly');
    });

    // Test AF — Ranking integrity remains competition ranking
    await test('Test AF — Ranking integrity', async () => {
      const full = await reportsService.getFullSectionRoster(testSectionAId, testYear1Id);
      // Student 1 (90 avg), Student 2 (80 avg), Student 3 (70 avg)
      const ranks = full.students.map((s: any) => s.rank);
      assert(ranks.includes(1), 'Rank 1 present');
      assert(ranks.includes(2), 'Rank 2 present');
      assert(ranks.includes(3), 'Rank 3 present');
    });

  } finally {
    console.log('\nCleaning up isolated Step 6 fixtures...');
    await (prisma as any).classRosterReview.deleteMany({ where: { classSectionId: { in: [testSectionAId, testSectionBId] } } });
    await (prisma as any).subjectResult.deleteMany({ where: { classSectionId: { in: [testSectionAId, testSectionBId] } } });
    await (prisma as any).sectionSubjectTeacher.deleteMany({ where: { classSectionId: { in: [testSectionAId, testSectionBId] } } });
    await prisma.studentEnrollment.deleteMany({ where: { classSectionId: { in: [testSectionAId, testSectionBId] } } });
    await prisma.classSection.deleteMany({ where: { id: { in: [testSectionAId, testSectionBId] } } });
    await prisma.subject.deleteMany({ where: { id: { in: [subMath, subEng] } } });
    await prisma.gradeLevel.deleteMany({ where: { id: testGradeId } });
    await prisma.academicYear.deleteMany({ where: { id: { in: [testYear1Id, testYear2Id] } } });
    await prisma.student.deleteMany({ where: { id: { in: [stu1Id, stu2Id, stu3Id] } } });
    await prisma.teacher.deleteMany({ where: { id: { in: [hrTeacherId, otherTeacherId] } } });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [
            hrTeacherUserId,
            otherTeacherUserId,
            adminUserId,
            `u-stu1-r-${suffix}`,
            `u-stu2-r-${suffix}`,
            `u-stu3-r-${suffix}`,
          ],
        },
      },
    });
    console.log('Cleaned up Step 6 test fixtures.');
  }

  console.log('\n====================================================');
  console.log('STEP 6 TEST EXECUTION SUMMARY');
  console.log('====================================================');
  results.forEach((r) => {
    if (r.passed) {
      console.log(`✅ [PASS] ${r.name}`);
    } else {
      console.log(`❌ [FAIL] ${r.name} — ${r.error}`);
    }
  });
  console.log('====================================================');
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`TOTAL: ${passedCount}/${results.length} PASSED`);
  console.log('====================================================\n');

  await prisma.$disconnect();

  if (passedCount !== results.length) {
    process.exit(1);
  }
  process.exit(0);
}

runStep6Tests().catch((e) => {
  console.error('Fatal error running Step 6 tests:', e);
  process.exit(1);
});
