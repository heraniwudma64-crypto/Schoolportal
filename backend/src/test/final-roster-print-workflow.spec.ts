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
  code: string;
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

async function runStep7Tests() {
  console.log('===================================================================');
  console.log('STEP 7: FINAL APPROVAL, OFFICIAL PRINTING & PRODUCTION LOCK SUITE');
  console.log('===================================================================\n');

  const suffix = Date.now().toString().slice(-6);
  const testYear1Id = `yr1-s7-${suffix}`;
  const testYear2Id = `yr2-s7-${suffix}`;
  const testGradeId = `grd-s7-${suffix}`;
  const testSectionAId = `sec-a-s7-${suffix}`;
  const testSectionBId = `sec-b-s7-${suffix}`;

  const hrTeacherUserId = `u-hr-s7-${suffix}`;
  const hrTeacherId = `t-hr-s7-${suffix}`;
  const otherTeacherUserId = `u-oth-s7-${suffix}`;
  const otherTeacherId = `t-oth-s7-${suffix}`;
  const adminUserId = `u-adm-s7-${suffix}`;
  const studentUserId = `u-stu-s7-${suffix}`;

  const stu1UserId = `u-s1-s7-${suffix}`;
  const stu2UserId = `u-s2-s7-${suffix}`;
  const stu3UserId = `u-s3-s7-${suffix}`;
  const stu4UserId = `u-s4-s7-${suffix}`;
  const stu5UserId = `u-s5-s7-${suffix}`;
  const stu6UserId = `u-s6-s7-${suffix}`;
  const stuBUserId = `u-sb-s7-${suffix}`;

  // Section A subjects: Math, English, Physics, Chemistry (4 dynamic subjects)
  const subMath = `sub-mat-s7-${suffix}`;
  const subEng = `sub-eng-s7-${suffix}`;
  const subPhy = `sub-phy-s7-${suffix}`;
  const subChem = `sub-che-s7-${suffix}`;

  // Section B subjects: Biology, History
  const subBio = `sub-bio-s7-${suffix}`;
  const subHist = `sub-his-s7-${suffix}`;

  // Section A students: 6 students for competition ranking and completeness testing
  const stu1Id = `stu-1-s7-${suffix}`;
  const stu2Id = `stu-2-s7-${suffix}`;
  const stu3Id = `stu-3-s7-${suffix}`;
  const stu4Id = `stu-4-s7-${suffix}`;
  const stu5Id = `stu-5-s7-${suffix}`;
  const stu6Id = `stu-6-s7-${suffix}`; // Incomplete student (missing Chemistry initially)

  const stuSecBId = `stu-b-s7-${suffix}`;

  const allStudentIds = [stu1Id, stu2Id, stu3Id, stu4Id, stu5Id, stu6Id, stuSecBId];
  const allSubjectIds = [subMath, subEng, subPhy, subChem, subBio, subHist];
  const allUserIds = [
    hrTeacherUserId,
    otherTeacherUserId,
    adminUserId,
    studentUserId,
    stu1UserId,
    stu2UserId,
    stu3UserId,
    stu4UserId,
    stu5UserId,
    stu6UserId,
    stuBUserId,
  ];

  let reviewRecordId: string = '';

  try {
    console.log('Setting up isolated Step 7 test fixtures...');

    // 1. Users
    await prisma.user.createMany({
      data: [
        { id: hrTeacherUserId, loginId: `hr_s7_${suffix}`, password: 'hash_secret_123', role: 'TEACHER', name: 'Homeroom Teacher S7' },
        { id: otherTeacherUserId, loginId: `oth_s7_${suffix}`, password: 'hash_secret_456', role: 'TEACHER', name: 'Other Teacher S7' },
        { id: adminUserId, loginId: `adm_s7_${suffix}`, password: 'hash_secret_789', role: 'ADMIN', name: 'Administrator S7' },
        { id: studentUserId, loginId: `stu_s7_${suffix}`, password: 'hash_secret_000', role: 'STUDENT', name: 'Student S7' },
        { id: stu1UserId, loginId: `s1_s7_${suffix}`, password: 'hash_secret_001', role: 'STUDENT', name: 'Alice Abebe' },
        { id: stu2UserId, loginId: `s2_s7_${suffix}`, password: 'hash_secret_002', role: 'STUDENT', name: 'Bekele Balcha' },
        { id: stu3UserId, loginId: `s3_s7_${suffix}`, password: 'hash_secret_003', role: 'STUDENT', name: 'Chala Chane' },
        { id: stu4UserId, loginId: `s4_s7_${suffix}`, password: 'hash_secret_004', role: 'STUDENT', name: 'Desta Dula' },
        { id: stu5UserId, loginId: `s5_s7_${suffix}`, password: 'hash_secret_005', role: 'STUDENT', name: 'Ephrem Eshetu' },
        { id: stu6UserId, loginId: `s6_s7_${suffix}`, password: 'hash_secret_006', role: 'STUDENT', name: 'Fikirte Feyisa' },
        { id: stuBUserId, loginId: `sb_s7_${suffix}`, password: 'hash_secret_007', role: 'STUDENT', name: 'Geleta Girma' },
      ],
    });

    // 2. Teachers
    await prisma.teacher.createMany({
      data: [
        { id: hrTeacherId, userId: hrTeacherUserId, staffId: `STF-HR-S7-${suffix}`, firstName: 'Homeroom', lastName: 'Teacher', updatedAt: new Date() },
        { id: otherTeacherId, userId: otherTeacherUserId, staffId: `STF-OTH-S7-${suffix}`, firstName: 'Other', lastName: 'Teacher', updatedAt: new Date() },
      ],
    });

    // 3. Academic Years
    await prisma.academicYear.createMany({
      data: [
        { id: testYear1Id, year: `2090/S7-1-${suffix}`, startDate: new Date('2090-09-01'), endDate: new Date('2091-06-30'), isCurrent: true, updatedAt: new Date() },
        { id: testYear2Id, year: `2091/S7-2-${suffix}`, startDate: new Date('2091-09-01'), endDate: new Date('2092-06-30'), isCurrent: false, updatedAt: new Date() },
      ],
    });

    // 4. Grade Level
    await prisma.gradeLevel.create({
      data: { id: testGradeId, name: `Grade 10 S7-${suffix}`, gradeNumber: 10, status: 'ACTIVE' },
    });

    // 5. Sections
    await prisma.classSection.createMany({
      data: [
        { id: testSectionAId, name: 'Section A', gradeLevelId: testGradeId, academicYearId: testYear1Id, teacherId: hrTeacherId, status: 'ACTIVE', capacity: 30, updatedAt: new Date() },
        { id: testSectionBId, name: 'Section B', gradeLevelId: testGradeId, academicYearId: testYear1Id, teacherId: otherTeacherId, status: 'ACTIVE', capacity: 30, updatedAt: new Date() },
      ],
    });

    // 6. Subjects
    await prisma.subject.createMany({
      data: [
        { id: subMath, name: `Mathematics S7 ${suffix}`, code: `MTH-${suffix}`, status: 'ACTIVE' },
        { id: subEng, name: `English S7 ${suffix}`, code: `ENG-${suffix}`, status: 'ACTIVE' },
        { id: subPhy, name: `Physics S7 ${suffix}`, code: `PHY-${suffix}`, status: 'ACTIVE' },
        { id: subChem, name: `Chemistry S7 ${suffix}`, code: `CHM-${suffix}`, status: 'ACTIVE' },
        { id: subBio, name: `Biology S7 ${suffix}`, code: `BIO-${suffix}`, status: 'ACTIVE' },
        { id: subHist, name: `History S7 ${suffix}`, code: `HIS-${suffix}`, status: 'ACTIVE' },
      ],
    });

    // 7. Subject Assignments
    await (prisma as any).sectionSubjectTeacher.createMany({
      data: [
        { classSectionId: testSectionAId, subjectId: subMath, teacherId: hrTeacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionAId, subjectId: subEng, teacherId: hrTeacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionAId, subjectId: subPhy, teacherId: hrTeacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionAId, subjectId: subChem, teacherId: hrTeacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionBId, subjectId: subBio, teacherId: otherTeacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionBId, subjectId: subHist, teacherId: otherTeacherId, academicYearId: testYear1Id },
      ],
    });

    // 8. Students
    await prisma.student.createMany({
      data: [
        { id: stu1Id, userId: stu1UserId, admissionNo: `ADM-1-${suffix}`, firstName: 'Alice', lastName: 'Abebe', gender: 'FEMALE', status: 'ACTIVE', updatedAt: new Date() },
        { id: stu2Id, userId: stu2UserId, admissionNo: `ADM-2-${suffix}`, firstName: 'Bekele', lastName: 'Balcha', gender: 'MALE', status: 'ACTIVE', updatedAt: new Date() },
        { id: stu3Id, userId: stu3UserId, admissionNo: `ADM-3-${suffix}`, firstName: 'Chala', lastName: 'Chane', gender: 'MALE', status: 'ACTIVE', updatedAt: new Date() },
        { id: stu4Id, userId: stu4UserId, admissionNo: `ADM-4-${suffix}`, firstName: 'Desta', lastName: 'Dula', gender: 'FEMALE', status: 'ACTIVE', updatedAt: new Date() },
        { id: stu5Id, userId: stu5UserId, admissionNo: `ADM-5-${suffix}`, firstName: 'Ephrem', lastName: 'Eshetu', gender: 'MALE', status: 'ACTIVE', updatedAt: new Date() },
        { id: stu6Id, userId: stu6UserId, admissionNo: `ADM-6-${suffix}`, firstName: 'Fikirte', lastName: 'Feyisa', gender: 'FEMALE', status: 'ACTIVE', updatedAt: new Date() },
        { id: stuSecBId, userId: stuBUserId, admissionNo: `ADM-B-${suffix}`, firstName: 'Geleta', lastName: 'Girma', gender: 'MALE', status: 'ACTIVE', updatedAt: new Date() },
      ],
    });

    // 9. Enrollments
    await prisma.studentEnrollment.createMany({
      data: [
        { studentId: stu1Id, classSectionId: testSectionAId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' },
        { studentId: stu2Id, classSectionId: testSectionAId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' },
        { studentId: stu3Id, classSectionId: testSectionAId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' },
        { studentId: stu4Id, classSectionId: testSectionAId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' },
        { studentId: stu5Id, classSectionId: testSectionAId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' },
        { studentId: stu6Id, classSectionId: testSectionAId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' },
        { studentId: stuSecBId, classSectionId: testSectionBId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' },
      ],
    });

    // 10. Grade Marks across 4 terms
    const terms = ['TERM_1', 'TERM_2', 'TERM_3', 'TERM_4'];
    const marksData: any[] = [];

    // Alice: 95 in all subjects
    // Bekele: 95 in all subjects (Tied Rank 1)
    // Chala: 85 in all subjects (Rank 3)
    // Desta: 80 in all subjects (Rank 4)
    // Ephrem: 80 in all subjects (Tied Rank 4)
    const completeStudents = [
      { id: stu1Id, score: 95 },
      { id: stu2Id, score: 95 },
      { id: stu3Id, score: 85 },
      { id: stu4Id, score: 80 },
      { id: stu5Id, score: 80 },
    ];
    const sectionASubjects = [subMath, subEng, subPhy, subChem];

    for (const stu of completeStudents) {
      for (const subj of sectionASubjects) {
        for (const term of terms) {
          marksData.push({
            studentId: stu.id,
            subjectId: subj,
            classSectionId: testSectionAId,
            academicYearId: testYear1Id,
            term,
            marks: stu.score,
            status: 'SUBMITTED',
          });
        }
      }
    }

    // Fikirte (stu6Id): only 3 subjects (Math, Eng, Phy), missing Chem initially
    for (const subj of [subMath, subEng, subPhy]) {
      for (const term of terms) {
        marksData.push({
          studentId: stu6Id,
          subjectId: subj,
          classSectionId: testSectionAId,
          academicYearId: testYear1Id,
          term,
          marks: 75,
          status: 'SUBMITTED',
        });
      }
    }

    await (prisma as any).subjectResult.createMany({ data: marksData });

    // 11. Initial conduct data
    const initialConduct: Record<string, string> = {
      [stu1Id]: 'A',
      [stu2Id]: 'A',
      [stu3Id]: 'B',
      [stu4Id]: 'B',
      [stu5Id]: 'C',
      [stu6Id]: 'C',
    };

    // Create initial approved ClassRosterReview
    const initialReview = await (prisma as any).classRosterReview.create({
      data: {
        classSectionId: testSectionAId,
        academicYearId: testYear1Id,
        homeroomTeacherId: hrTeacherId,
        status: 'APPROVED',
        conductData: initialConduct,
        submittedAt: new Date(Date.now() - 3600000),
        submittedById: hrTeacherUserId,
        reviewedAt: new Date(),
        reviewedById: adminUserId,
      },
    });
    reviewRecordId = initialReview.id;

    console.log('Fixtures initialized. Running Step 7 tests...\n');

    // ── Test A: Approved print ────────────────────────────────────────────────
    try {
      const printData = await reportsService.getOfficialPrintRoster(
        testSectionAId,
        testYear1Id,
        adminUserId,
        'ADMIN',
      );
      assert(printData !== null, 'Print data should not be null');
      assert(printData.officialHeader.status === 'APPROVED', 'Header status must be APPROVED');
      assert(printData.students.length === 6, 'Should contain all 6 enrolled students');
      assert(Array.isArray(printData.paperRows), 'paperRows must be returned');
      results.push({ code: 'A', name: 'Approved print: APPROVED roster can be printed', passed: true });
      console.log('✓ Test A PASS');
    } catch (e: any) {
      results.push({ code: 'A', name: 'Approved print', passed: false, error: e.message });
      console.log('✗ Test A FAIL:', e.message);
    }

    // ── Test B: Draft print lock ──────────────────────────────────────────────
    try {
      await (prisma as any).classRosterReview.update({
        where: { id: reviewRecordId },
        data: { status: 'DRAFT', reviewedAt: null, reviewedById: null },
      });
      let caught = false;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, adminUserId, 'ADMIN');
      } catch (err: any) {
        caught = true;
        assert(err instanceof BadRequestException, 'Should throw BadRequestException');
        assert(err.message.includes('Official print is locked'), 'Error message must state print is locked');
      }
      assert(caught, 'Expected DRAFT roster print to be rejected');
      results.push({ code: 'B', name: 'Draft print lock: DRAFT roster cannot be printed', passed: true });
    } catch (e: any) {
      results.push({ code: 'B', name: 'Draft print lock', passed: false, error: e.message });
    }

    // ── Test C: Submitted print lock ──────────────────────────────────────────
    try {
      await (prisma as any).classRosterReview.update({
        where: { id: reviewRecordId },
        data: { status: 'SUBMITTED_TO_ADMIN' },
      });
      let caught = false;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, adminUserId, 'ADMIN');
      } catch (err: any) {
        caught = true;
        assert(err instanceof BadRequestException, 'Should throw BadRequestException');
        assert(err.message.includes('Official print is locked'), 'Error message must state print is locked');
      }
      assert(caught, 'Expected SUBMITTED_TO_ADMIN roster print to be rejected');
      results.push({ code: 'C', name: 'Submitted print lock: SUBMITTED_TO_ADMIN roster cannot be printed', passed: true });
    } catch (e: any) {
      results.push({ code: 'C', name: 'Submitted print lock', passed: false, error: e.message });
    }

    // ── Test D: Rejected print lock ───────────────────────────────────────────
    try {
      await (prisma as any).classRosterReview.update({
        where: { id: reviewRecordId },
        data: { status: 'REJECTED', rejectionReason: 'Test rejection' },
      });
      let caught = false;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, adminUserId, 'ADMIN');
      } catch (err: any) {
        caught = true;
        assert(err instanceof BadRequestException, 'Should throw BadRequestException');
        assert(err.message.includes('Official print is locked'), 'Error message must state print is locked');
      }
      assert(caught, 'Expected REJECTED roster print to be rejected');
      results.push({ code: 'D', name: 'Rejected print lock: REJECTED roster cannot be printed', passed: true });
    } catch (e: any) {
      results.push({ code: 'D', name: 'Rejected print lock', passed: false, error: e.message });
    }

    // ── Test E: Approval required (no review record) ──────────────────────────
    try {
      let caught = false;
      try {
        // Section B has no review record at all
        await reportsService.getOfficialPrintRoster(testSectionBId, testYear1Id, adminUserId, 'ADMIN');
      } catch (err: any) {
        caught = true;
        assert(err instanceof BadRequestException, 'Should throw BadRequestException');
        assert(err.message.includes('Official print is locked'), 'Error message must state print is locked');
      }
      assert(caught, 'Expected missing review record to reject official print');
      results.push({ code: 'E', name: 'Approval required: Print endpoint requires APPROVED status', passed: true });
    } catch (e: any) {
      results.push({ code: 'E', name: 'Approval required', passed: false, error: e.message });
    }

    // Set Section A back to APPROVED for editing lock tests
    await (prisma as any).classRosterReview.update({
      where: { id: reviewRecordId },
      data: { status: 'APPROVED', reviewedAt: new Date(), reviewedById: adminUserId },
    });

    // ── Test F: Approved editing lock (save draft) ────────────────────────────
    try {
      let caught = false;
      try {
        await reportsService.saveRosterDraft(
          { classSectionId: testSectionAId, academicYearId: testYear1Id },
          hrTeacherUserId,
        );
      } catch (err: any) {
        caught = true;
        assert(err instanceof BadRequestException, 'Should throw BadRequestException');
        assert(err.message.includes('approved and is locked'), 'Error should say roster is approved and locked');
      }
      assert(caught, 'Expected saveRosterDraft on approved roster to fail');
      results.push({ code: 'F', name: 'Approved editing lock: Approved roster cannot save draft', passed: true });
    } catch (e: any) {
      results.push({ code: 'F', name: 'Approved editing lock', passed: false, error: e.message });
    }

    // ── Test G: Approved conduct lock ─────────────────────────────────────────
    try {
      let caught = false;
      try {
        await reportsService.saveConduct(
          {
            classSectionId: testSectionAId,
            academicYearId: testYear1Id,
            conductData: { [stu1Id]: 'B' },
          },
          hrTeacherUserId,
        );
      } catch (err: any) {
        caught = true;
        assert(err instanceof BadRequestException, 'Should throw BadRequestException');
        assert(err.message.includes('approved and is locked'), 'Error should say conduct is locked');
      }
      assert(caught, 'Expected saveConduct on approved roster to fail');
      results.push({ code: 'G', name: 'Approved conduct lock: Approved roster cannot modify conduct', passed: true });
    } catch (e: any) {
      results.push({ code: 'G', name: 'Approved conduct lock', passed: false, error: e.message });
    }

    // ── Test H: Approved grade lock ───────────────────────────────────────────
    try {
      let caughtSaveDraft = false;
      let caughtSubmit = false;
      let caughtReturn = false;

      // 1. saveGradesDraft
      try {
        await resultsService.saveGradesDraft(
          {
            classSectionId: testSectionAId,
            academicYearId: testYear1Id,
            subjectId: subMath,
            term: 'TERM_1',
            grades: [{ studentId: stu1Id, marks: 99 }],
          },
          hrTeacherUserId,
        );
      } catch (err: any) {
        caughtSaveDraft = true;
        assert(err.message.includes('approved by the administrator and is locked'), 'Message must indicate locked');
      }

      // 2. submitToHomeroom
      try {
        await resultsService.submitToHomeroom(
          {
            classSectionId: testSectionAId,
            academicYearId: testYear1Id,
            subjectId: subMath,
            term: 'TERM_1',
          },
          hrTeacherUserId,
        );
      } catch (err: any) {
        caughtSubmit = true;
        assert(err.message.includes('approved by the administrator and is locked'), 'Message must indicate locked');
      }

      // 3. returnSubjectResultToTeacher
      try {
        await resultsService.returnSubjectResultToTeacher(
          {
            classSectionId: testSectionAId,
            academicYearId: testYear1Id,
            subjectId: subMath,
            term: 'TERM_1',
            reason: 'Correction',
          },
          hrTeacherUserId,
        );
      } catch (err: any) {
        caughtReturn = true;
        assert(err.message.includes('approved and is locked'), 'Message must indicate locked');
      }

      assert(caughtSaveDraft, 'saveGradesDraft must be blocked on APPROVED roster');
      assert(caughtSubmit, 'submitToHomeroom must be blocked on APPROVED roster');
      assert(caughtReturn, 'returnSubjectResultToTeacher must be blocked on APPROVED roster');
      results.push({ code: 'H', name: 'Approved grade lock: Approved roster cannot modify grades', passed: true });
    } catch (e: any) {
      results.push({ code: 'H', name: 'Approved grade lock', passed: false, error: e.message });
    }

    // ── Test I: Reopen ────────────────────────────────────────────────────────
    try {
      const reopenRes = await reportsService.reopenRoster(
        reviewRecordId,
        adminUserId,
        'Grade verification required by academic office',
      );
      assert(reopenRes.success, 'Reopen must report success');
      assert(reopenRes.review.status === 'DRAFT', 'Review status must transition to DRAFT');
      assert(
        reopenRes.review.rejectionReason.includes('Grade verification required'),
        'Reopen reason must be preserved',
      );
      results.push({ code: 'I', name: 'Reopen: APPROVED → DRAFT works through Admin reopen workflow', passed: true });
    } catch (e: any) {
      results.push({ code: 'I', name: 'Reopen', passed: false, error: e.message });
    }

    // ── Test J: Reopen print lock ─────────────────────────────────────────────
    try {
      let caught = false;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, adminUserId, 'ADMIN');
      } catch (err: any) {
        caught = true;
        assert(err.message.includes('Official print is locked'), 'Print must be locked when reopened');
      }
      assert(caught, 'Reopened roster print must be locked');
      results.push({ code: 'J', name: 'Reopen print lock: Reopened roster cannot be printed', passed: true });
    } catch (e: any) {
      results.push({ code: 'J', name: 'Reopen print lock', passed: false, error: e.message });
    }

    // ── Test K: Reopen editing ────────────────────────────────────────────────
    try {
      // Conduct editing should now succeed in DRAFT
      const updatedConduct = {
        [stu1Id]: 'A',
        [stu2Id]: 'B', // updated from A to B
        [stu3Id]: 'B',
        [stu4Id]: 'B',
        [stu5Id]: 'C',
        [stu6Id]: 'C',
      };
      const conductRes = await reportsService.saveConduct(
        {
          classSectionId: testSectionAId,
          academicYearId: testYear1Id,
          conductData: updatedConduct,
        },
        hrTeacherUserId,
      );
      assert(conductRes.success, 'Conduct save should succeed in reopened DRAFT');
      assert(conductRes.conductData[stu2Id] === 'B', 'Updated conduct must be saved');
      results.push({ code: 'K', name: 'Reopen editing: Reopened roster allows permitted editing', passed: true });
    } catch (e: any) {
      results.push({ code: 'K', name: 'Reopen editing', passed: false, error: e.message });
    }

    // ── Test L: Reapproval ────────────────────────────────────────────────────
    try {
      // 1. Submit Chemistry for student 6 so all assigned subjects have complete submissions
      const chemMissingData: any[] = [];
      for (const term of terms) {
        chemMissingData.push({
          studentId: stu6Id,
          subjectId: subChem,
          classSectionId: testSectionAId,
          academicYearId: testYear1Id,
          term,
          marks: 70,
          status: 'SUBMITTED',
        });
      }
      await (prisma as any).subjectResult.createMany({ data: chemMissingData });

      // 2. Homeroom submits to admin
      const submitRes = await reportsService.submitToAdmin(
        testSectionAId,
        testYear1Id,
        'roster',
        hrTeacherUserId,
      );
      assert(submitRes.success, 'Submit to admin should succeed');
      assert(submitRes.status === 'SUBMITTED_TO_ADMIN', 'Status must be SUBMITTED_TO_ADMIN');

      // 3. Admin approves again
      const approveRes = await reportsService.approveRoster(submitRes.reviewId, adminUserId);
      assert(approveRes.success, 'Approve roster should succeed');
      assert(approveRes.review.status === 'APPROVED', 'Status must be APPROVED');
      results.push({ code: 'L', name: 'Reapproval: Reopened roster can be submitted again and approved again', passed: true });
    } catch (e: any) {
      results.push({ code: 'L', name: 'Reapproval', passed: false, error: e.message });
    }

    // ── Test M: Second official print ─────────────────────────────────────────
    try {
      const printData2 = await reportsService.getOfficialPrintRoster(
        testSectionAId,
        testYear1Id,
        adminUserId,
        'ADMIN',
      );
      assert(printData2 !== null, 'Print payload must be accessible after reapproval');
      assert(printData2.officialHeader.status === 'APPROVED', 'Header must be APPROVED');
      results.push({ code: 'M', name: 'Second official print: After reapproval, printing is available again', passed: true });
    } catch (e: any) {
      results.push({ code: 'M', name: 'Second official print', passed: false, error: e.message });
    }

    // ── Test N: No duplicate review record ────────────────────────────────────
    try {
      const allReviews = await (prisma as any).classRosterReview.findMany({
        where: { classSectionId: testSectionAId, academicYearId: testYear1Id },
      });
      assert(allReviews.length === 1, `Expected exactly 1 review record, found ${allReviews.length}`);
      assert(allReviews[0].id === reviewRecordId, 'Review record ID must be reused across reopen/resubmit');
      results.push({ code: 'N', name: 'No duplicate review: Reopen/resubmit reuses the same review record', passed: true });
    } catch (e: any) {
      results.push({ code: 'N', name: 'No duplicate review', passed: false, error: e.message });
    }

    // ── Test O: Section isolation ─────────────────────────────────────────────
    try {
      let caughtNotFound = false;
      try {
        await reportsService.getOfficialPrintRoster('non-existent-sec-id', testYear1Id, adminUserId, 'ADMIN');
      } catch (err: any) {
        caughtNotFound = err instanceof NotFoundException;
      }
      assert(caughtNotFound, 'Non-existent section must throw NotFoundException');

      // Teacher from Section B trying to access Section A
      let caughtForbidden = false;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, otherTeacherUserId, 'TEACHER');
      } catch (err: any) {
        caughtForbidden = err instanceof ForbiddenException;
      }
      assert(caughtForbidden, 'Other teacher accessing section A must throw ForbiddenException');
      results.push({ code: 'O', name: 'Section isolation: Cannot access another section roster', passed: true });
    } catch (e: any) {
      results.push({ code: 'O', name: 'Section isolation', passed: false, error: e.message });
    }

    // ── Test P: Academic year isolation ───────────────────────────────────────
    try {
      let caughtMismatch = false;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear2Id, adminUserId, 'ADMIN');
      } catch (err: any) {
        caughtMismatch = err instanceof BadRequestException && err.message.includes('Academic Year mismatch');
      }
      assert(caughtMismatch, 'Academic year mismatch must throw BadRequestException');
      results.push({ code: 'P', name: 'Academic year isolation: Cannot query mismatched academic year', passed: true });
    } catch (e: any) {
      results.push({ code: 'P', name: 'Academic year isolation', passed: false, error: e.message });
    }

    // ── Test Q: Calculation integrity ─────────────────────────────────────────
    try {
      const printPayload = await reportsService.getOfficialPrintRoster(
        testSectionAId,
        testYear1Id,
        adminUserId,
        'ADMIN',
      );
      const calculatedRoster = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);

      // Student sums and averages must match CalculationService directly
      for (const pStudent of printPayload.students) {
        const cStudent = calculatedRoster.students.find((s) => s.studentId === pStudent.studentId);
        assert(!!cStudent, `Student ${pStudent.studentId} must exist in calculation service result`);
        assert(pStudent.sum === cStudent!.sum, `Sum must match for ${pStudent.studentName}`);
        assert(pStudent.average === cStudent!.average, `Average must match for ${pStudent.studentName}`);
        assert(pStudent.rank === cStudent!.rank, `Rank must match for ${pStudent.studentName}`);
      }
      results.push({ code: 'Q', name: 'Calculation integrity: Official print data matches CalculationService', passed: true });
    } catch (e: any) {
      results.push({ code: 'Q', name: 'Calculation integrity', passed: false, error: e.message });
    }

    // ── Test R: Ranking integrity (Competition Ranking) ───────────────────────
    try {
      const printPayload = await reportsService.getOfficialPrintRoster(
        testSectionAId,
        testYear1Id,
        adminUserId,
        'ADMIN',
      );
      // Alice & Bekele both scored 95 in all 4 subjects -> Avg 95.0, sum 380 -> rank 1
      const alice = printPayload.students.find((s: any) => s.studentId === stu1Id);
      const bekele = printPayload.students.find((s: any) => s.studentId === stu2Id);
      const chala = printPayload.students.find((s: any) => s.studentId === stu3Id);
      const desta = printPayload.students.find((s: any) => s.studentId === stu4Id);
      const ephrem = printPayload.students.find((s: any) => s.studentId === stu5Id);
      const fikirte = printPayload.students.find((s: any) => s.studentId === stu6Id);

      assert(alice?.rank === 1, `Alice must have rank 1, got ${alice?.rank}`);
      assert(bekele?.rank === 1, `Bekele must have rank 1, got ${bekele?.rank}`);
      assert(chala?.rank === 3, `Chala must have rank 3 (skipping rank 2), got ${chala?.rank}`);
      assert(desta?.rank === 4, `Desta must have rank 4, got ${desta?.rank}`);
      assert(ephrem?.rank === 4, `Ephrem must have rank 4 (tied with Desta), got ${ephrem?.rank}`);
      // Fikirte now has complete scores (3x75 + 1x70 = 295 / 4 = 73.75) -> rank 6
      assert(fikirte?.rank === 6, `Fikirte must have rank 6 (skipping rank 5), got ${fikirte?.rank}`);
      results.push({ code: 'R', name: 'Ranking integrity: Competition ranking 1, 1, 3, 4, 4, 6 verified', passed: true });
    } catch (e: any) {
      results.push({ code: 'R', name: 'Ranking integrity', passed: false, error: e.message });
    }

    // ── Test S: Conduct integrity ─────────────────────────────────────────────
    try {
      const printPayload = await reportsService.getOfficialPrintRoster(
        testSectionAId,
        testYear1Id,
        adminUserId,
        'ADMIN',
      );
      const alice = printPayload.students.find((s: any) => s.studentId === stu1Id);
      const bekele = printPayload.students.find((s: any) => s.studentId === stu2Id);
      const ephrem = printPayload.students.find((s: any) => s.studentId === stu5Id);

      assert(alice?.conduct === 'A', `Alice conduct must be 'A', got ${alice?.conduct}`);
      assert(bekele?.conduct === 'B', `Bekele conduct was updated to 'B', got ${bekele?.conduct}`);
      assert(ephrem?.conduct === 'C', `Ephrem conduct must be 'C', got ${ephrem?.conduct}`);
      results.push({ code: 'S', name: 'Conduct integrity: Official print conduct matches saved conductData', passed: true });
    } catch (e: any) {
      results.push({ code: 'S', name: 'Conduct integrity', passed: false, error: e.message });
    }

    // ── Test T: 7-row integrity ───────────────────────────────────────────────
    try {
      const printPayload = await reportsService.getOfficialPrintRoster(
        testSectionAId,
        testYear1Id,
        adminUserId,
        'ADMIN',
      );
      assert(printPayload.paperRows.length === 6, 'Must have 6 student groups');
      const expectedPeriods = ['1st', '2nd', 'Ave1', '3rd', '4th', 'Ave2', 'Yearly'];

      for (const group of printPayload.paperRows) {
        assert(group.periods.length === 7, `Every student must have exactly 7 period rows, got ${group.periods.length}`);
        const actualPeriods = group.periods.map((p: any) => p.period);
        assert(
          JSON.stringify(actualPeriods) === JSON.stringify(expectedPeriods),
          `Periods must be 1st, 2nd, Ave1, 3rd, 4th, Ave2, Yearly. Got ${actualPeriods.join(', ')}`,
        );
      }
      results.push({ code: 'T', name: '7-row integrity: Every student has exactly 7 academic-period rows', passed: true });
    } catch (e: any) {
      results.push({ code: 'T', name: '7-row integrity', passed: false, error: e.message });
    }

    // ── Test U: Dynamic subjects ──────────────────────────────────────────────
    try {
      const printPayload = await reportsService.getOfficialPrintRoster(
        testSectionAId,
        testYear1Id,
        adminUserId,
        'ADMIN',
      );
      assert(printPayload.subjects.length === 4, `Expected 4 subjects, found ${printPayload.subjects.length}`);
      const subjectCodes = printPayload.subjects.map((s: any) => s.code);
      assert(subjectCodes.includes(`MTH-${suffix}`), 'Must include dynamic Math subject');
      assert(subjectCodes.includes(`ENG-${suffix}`), 'Must include dynamic English subject');
      assert(subjectCodes.includes(`PHY-${suffix}`), 'Must include dynamic Physics subject');
      assert(subjectCodes.includes(`CHM-${suffix}`), 'Must include dynamic Chemistry subject');
      results.push({ code: 'U', name: 'Dynamic subjects: Official print uses section subjects dynamically', passed: true });
    } catch (e: any) {
      results.push({ code: 'U', name: 'Dynamic subjects', passed: false, error: e.message });
    }

    // ── Test V: ClassSection invariant ────────────────────────────────────────
    try {
      const section = await prisma.classSection.findUnique({
        where: { id: testSectionAId },
        select: { status: true },
      });
      assert(section?.status === 'ACTIVE', `ClassSection.status must remain ACTIVE, got ${section?.status}`);
      results.push({ code: 'V', name: 'ClassSection invariant: ClassSection.status remains ACTIVE', passed: true });
    } catch (e: any) {
      results.push({ code: 'V', name: 'ClassSection invariant', passed: false, error: e.message });
    }

    // ── Test W: Authorization ─────────────────────────────────────────────────
    try {
      // 1. Student role cannot access
      let caughtStudent = false;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, studentUserId, 'STUDENT');
      } catch (err: any) {
        caughtStudent = err instanceof ForbiddenException;
      }
      assert(caughtStudent, 'STUDENT role must be rejected with ForbiddenException');

      // 2. Homeroom teacher can access
      const hrPrint = await reportsService.getOfficialPrintRoster(
        testSectionAId,
        testYear1Id,
        hrTeacherUserId,
        'TEACHER',
      );
      assert(hrPrint !== null, 'Assigned homeroom teacher must be allowed to access official print');
      results.push({ code: 'W', name: 'Authorization: Unauthorized roles blocked; Admin and Homeroom authorized', passed: true });
    } catch (e: any) {
      results.push({ code: 'W', name: 'Authorization', passed: false, error: e.message });
    }

  } catch (setupError: any) {
    console.error('Test setup failed:', setupError);
  } finally {
    console.log('\nCleaning up isolated test fixtures...');
    try {
      await (prisma as any).subjectResult.deleteMany({ where: { classSectionId: testSectionAId } });
      await (prisma as any).classRosterReview.deleteMany({ where: { classSectionId: testSectionAId } });
      await (prisma as any).sectionSubjectTeacher.deleteMany({ where: { classSectionId: { in: [testSectionAId, testSectionBId] } } });
      await prisma.studentEnrollment.deleteMany({ where: { studentId: { in: allStudentIds } } });
      await prisma.student.deleteMany({ where: { id: { in: allStudentIds } } });
      await prisma.subject.deleteMany({ where: { id: { in: allSubjectIds } } });
      await prisma.classSection.deleteMany({ where: { id: { in: [testSectionAId, testSectionBId] } } });
      await prisma.gradeLevel.deleteMany({ where: { id: testGradeId } });
      await prisma.teacher.deleteMany({ where: { id: { in: [hrTeacherId, otherTeacherId] } } });
      await prisma.academicYear.deleteMany({ where: { id: { in: [testYear1Id, testYear2Id] } } });
      await prisma.user.deleteMany({ where: { id: { in: allUserIds } } });
    } catch (cleanupError) {
      console.warn('Cleanup warning:', cleanupError);
    }
    await prisma.$disconnect();
  }

  // Report Summary
  console.log('\n===================================================================');
  console.log('STEP 7 TEST EXECUTION SUMMARY');
  console.log('===================================================================');
  let passCount = 0;
  for (const r of results) {
    const statusStr = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${r.code}] ${statusStr}: ${r.name}`);
    if (r.error) console.log(`    Error: ${r.error}`);
    if (r.passed) passCount++;
  }
  console.log(`\nTotal: ${passCount}/${results.length} passed.`);

  if (passCount === results.length && results.length >= 23) {
    console.log('\n>>> STEP 7 SUITE: ALL TESTS PASSED <<<\n');
    process.exit(0);
  } else {
    console.error('\n>>> STEP 7 SUITE: SOME TESTS FAILED <<<\n');
    process.exit(1);
  }
}

runStep7Tests();
