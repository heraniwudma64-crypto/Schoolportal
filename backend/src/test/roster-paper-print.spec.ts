import { PrismaClient } from '@prisma/client';
import { CalculationService } from '../modules/results/calculation.service';
import { ReportsService } from '../modules/reports/reports.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

const prisma = new PrismaClient();
const prismaService = prisma as unknown as PrismaService;
const calculationService = new CalculationService(prismaService);
const reportsService = new ReportsService(prismaService, calculationService);

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

async function runTests() {
  console.log('====================================================');
  console.log('STEP 4: ROSTER PAPER PRINT & WORKFLOW TEST SUITE');
  console.log('====================================================\n');

  const suffix = Date.now().toString().slice(-6);
  const testYear1Id = `yr1-p-${suffix}`;
  const testYear2Id = `yr2-p-${suffix}`;
  const testGradeId = `grd-p-${suffix}`;
  const testSectionAId = `sec-a-p-${suffix}`;
  const testSectionBId = `sec-b-p-${suffix}`;

  const hrTeacherUserId = `u-hr-p-${suffix}`;
  const hrTeacherId = `t-hr-p-${suffix}`;
  const otherTeacherUserId = `u-oth-p-${suffix}`;
  const otherTeacherId = `t-oth-p-${suffix}`;
  const adminUserId = `u-adm-p-${suffix}`;

  // Section A subjects: Math, English, Physics, Chemistry (4 subjects)
  const subMath = `sub-mat-p-${suffix}`;
  const subEng = `sub-eng-p-${suffix}`;
  const subPhy = `sub-phy-p-${suffix}`;
  const subChem = `sub-che-p-${suffix}`;

  // Section B subjects: Biology, History (2 subjects)
  const subBio = `sub-bio-p-${suffix}`;
  const subHist = `sub-his-p-${suffix}`;

  // Section A students: 6 students for competition ranking + incomplete student testing
  const stu1Id = `stu-1-p-${suffix}`;
  const stu2Id = `stu-2-p-${suffix}`;
  const stu3Id = `stu-3-p-${suffix}`; // incomplete: missing Physics
  const stu4Id = `stu-4-p-${suffix}`;
  const stu5Id = `stu-5-p-${suffix}`;
  const stu6Id = `stu-6-p-${suffix}`;

  // Section B student
  const stuSecBId = `stu-secb-p-${suffix}`;

  const allStudentIds = [stu1Id, stu2Id, stu3Id, stu4Id, stu5Id, stu6Id, stuSecBId];
  const allSubjectIds = [subMath, subEng, subPhy, subChem, subBio, subHist];

  try {
    console.log('Setting up isolated Step 4 test fixtures...');

    // 1. Academic Years
    await prisma.academicYear.createMany({
      data: [
        {
          id: testYear1Id,
          year: `2085/P1-${suffix}`,
          startDate: new Date('2085-09-01'),
          endDate: new Date('2086-06-30'),
          isCurrent: true,
          updatedAt: new Date(),
        },
        {
          id: testYear2Id,
          year: `2086/P2-${suffix}`,
          startDate: new Date('2086-09-01'),
          endDate: new Date('2087-06-30'),
          isCurrent: false,
          updatedAt: new Date(),
        },
      ],
    });

    // 2. Grade Level
    await prisma.gradeLevel.create({
      data: {
        id: testGradeId,
        name: `Grade 10 P-${suffix}`,
        gradeNumber: 10,
        status: 'ACTIVE',
      },
    });

    // 3. Teachers & Users
    await prisma.user.createMany({
      data: [
        {
          id: hrTeacherUserId,
          loginId: `hr_p_${suffix}`,
          name: 'Henok Homeroom',
          email: `hr-p-${suffix}@test.com`,
          password: 'hash',
          role: 'TEACHER',
        },
        {
          id: otherTeacherUserId,
          loginId: `oth_p_${suffix}`,
          name: 'Other Teacher',
          email: `oth-p-${suffix}@test.com`,
          password: 'hash',
          role: 'TEACHER',
        },
        {
          id: adminUserId,
          loginId: `adm_p_${suffix}`,
          name: 'Admin User',
          email: `adm-p-${suffix}@test.com`,
          password: 'hash',
          role: 'ADMIN',
        },
      ],
    });

    await prisma.teacher.createMany({
      data: [
        {
          id: hrTeacherId,
          userId: hrTeacherUserId,
          firstName: 'Henok',
          lastName: 'Homeroom',
          updatedAt: new Date(),
        },
        {
          id: otherTeacherId,
          userId: otherTeacherUserId,
          firstName: 'Other',
          lastName: 'Teacher',
          updatedAt: new Date(),
        },
      ],
    });

    // 4. Class Sections (ClassSection.status must remain ACTIVE)
    await prisma.classSection.createMany({
      data: [
        {
          id: testSectionAId,
          name: 'Section A',
          academicYearId: testYear1Id,
          gradeLevelId: testGradeId,
          teacherId: hrTeacherId,
          status: 'ACTIVE',
          capacity: 40,
          updatedAt: new Date(),
        },
        {
          id: testSectionBId,
          name: 'Section B',
          academicYearId: testYear1Id,
          gradeLevelId: testGradeId,
          teacherId: otherTeacherId,
          status: 'ACTIVE',
          capacity: 40,
          updatedAt: new Date(),
        },
      ],
    });

    // 5. Subjects
    await prisma.subject.createMany({
      data: [
        { id: subMath, name: `Mathematics P-${suffix}`, code: `MAT-P-${suffix}`, updatedAt: new Date() },
        { id: subEng, name: `English P-${suffix}`, code: `ENG-P-${suffix}`, updatedAt: new Date() },
        { id: subPhy, name: `Physics P-${suffix}`, code: `PHY-P-${suffix}`, updatedAt: new Date() },
        { id: subChem, name: `Chemistry P-${suffix}`, code: `CHE-P-${suffix}`, updatedAt: new Date() },
        { id: subBio, name: `Biology P-${suffix}`, code: `BIO-P-${suffix}`, updatedAt: new Date() },
        { id: subHist, name: `History P-${suffix}`, code: `HIS-P-${suffix}`, updatedAt: new Date() },
      ],
    });

    // SectionSubjectTeacher mappings:
    // Section A has Math, Eng, Phy, Chem (4 subjects)
    await (prisma as any).sectionSubjectTeacher.createMany({
      data: [
        { classSectionId: testSectionAId, subjectId: subMath, teacherId: hrTeacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionAId, subjectId: subEng, teacherId: hrTeacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionAId, subjectId: subPhy, teacherId: hrTeacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionAId, subjectId: subChem, teacherId: hrTeacherId, academicYearId: testYear1Id },
        // Section B has Bio, Hist (2 subjects)
        { classSectionId: testSectionBId, subjectId: subBio, teacherId: otherTeacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionBId, subjectId: subHist, teacherId: otherTeacherId, academicYearId: testYear1Id },
      ],
    });

    // 6. Students
    for (let i = 0; i < allStudentIds.length; i++) {
      const sId = allStudentIds[i];
      const sNum = i + 1;
      const sUserId = `u-stu-${sNum}-${suffix}`;
      await prisma.user.create({
        data: {
          id: sUserId,
          loginId: `stu_p_${sNum}_${suffix}`,
          name: `StudentP${sNum} Lema${sNum}`,
          email: `stu-p-${sNum}-${suffix}@test.com`,
          password: 'hash',
          role: 'STUDENT',
        },
      });
      await prisma.student.create({
        data: {
          id: sId,
          userId: sUserId,
          firstName: `StudentP${sNum}`,
          lastName: `Lema${sNum}`,
          admissionNo: `ADM-P${sNum}-${suffix}`,
          gender: sNum % 2 === 0 ? 'F' : 'M',
          updatedAt: new Date(),
        },
      });
    }

    // 7. Student Enrollments
    const enrollments = [
      { id: `enr-1-${suffix}`, studentId: stu1Id, classSectionId: testSectionAId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' as const, enrollmentDate: new Date(), updatedAt: new Date() },
      { id: `enr-2-${suffix}`, studentId: stu2Id, classSectionId: testSectionAId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' as const, enrollmentDate: new Date(), updatedAt: new Date() },
      { id: `enr-3-${suffix}`, studentId: stu3Id, classSectionId: testSectionAId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' as const, enrollmentDate: new Date(), updatedAt: new Date() },
      { id: `enr-4-${suffix}`, studentId: stu4Id, classSectionId: testSectionAId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' as const, enrollmentDate: new Date(), updatedAt: new Date() },
      { id: `enr-5-${suffix}`, studentId: stu5Id, classSectionId: testSectionAId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' as const, enrollmentDate: new Date(), updatedAt: new Date() },
      { id: `enr-6-${suffix}`, studentId: stu6Id, classSectionId: testSectionAId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' as const, enrollmentDate: new Date(), updatedAt: new Date() },
      { id: `enr-b-${suffix}`, studentId: stuSecBId, classSectionId: testSectionBId, academicYearId: testYear1Id, gradeLevelId: testGradeId, status: 'ACTIVE' as const, enrollmentDate: new Date(), updatedAt: new Date() },
    ];
    await prisma.studentEnrollment.createMany({ data: enrollments });

    // 8. Subject Results for Section A:
    // To test competition ranking (1, 1, 3, 4, 4, 6):
    // Stu1 & Stu2 will tie for 1st (all 90s)
    // Stu4 will be 3rd (all 85s)
    // Stu5 & Stu6 will tie for 4th (all 80s)
    // Student with 70s will be 6th.
    // Stu3 is INCOMPLETE (missing Physics completely)
    const terms = ['TERM_1', 'TERM_2', 'TERM_3', 'TERM_4'] as const;
    const secASubjects = [subMath, subEng, subPhy, subChem];

    const resultsToCreate: any[] = [];
    let rIdx = 0;

    const studentScoreMap: Record<string, number> = {
      [stu1Id]: 90, // Rank 1 tie
      [stu2Id]: 90, // Rank 1 tie
      [stu4Id]: 85, // Rank 3
      [stu5Id]: 80, // Rank 4 tie
      [stu6Id]: 80, // Rank 4 tie
    };

    // Populate complete students (stu1, stu2, stu4, stu5, stu6)
    for (const [sId, score] of Object.entries(studentScoreMap)) {
      for (const subjId of secASubjects) {
        for (const term of terms) {
          rIdx++;
          resultsToCreate.push({
            id: `sr-${rIdx}-${suffix}`,
            studentId: sId,
            subjectId: subjId,
            classSectionId: testSectionAId,
            academicYearId: testYear1Id,
            term,
            marks: score,
            status: 'SUBMITTED',
            updatedAt: new Date(),
          });
        }
      }
    }

    // Stu3: Incomplete (has Math, Eng, Chem but MISSING subPhy)
    for (const subjId of [subMath, subEng, subChem]) {
      for (const term of terms) {
        rIdx++;
        resultsToCreate.push({
          id: `sr-${rIdx}-${suffix}`,
          studentId: stu3Id,
          subjectId: subjId,
          classSectionId: testSectionAId,
          academicYearId: testYear1Id,
          term,
          marks: 75,
          status: 'SUBMITTED',
          updatedAt: new Date(),
        });
      }
    }

    // Populate Section B student (has Bio and Hist: 2 subjects)
    for (const subjId of [subBio, subHist]) {
      for (const term of terms) {
        rIdx++;
        resultsToCreate.push({
          id: `sr-${rIdx}-${suffix}`,
          studentId: stuSecBId,
          subjectId: subjId,
          classSectionId: testSectionBId,
          academicYearId: testYear1Id,
          term,
          marks: 88,
          status: 'SUBMITTED',
          updatedAt: new Date(),
        });
      }
    }

    await (prisma as any).subjectResult.createMany({ data: resultsToCreate });

    // 9. Initial Roster Review for Section A: DRAFT
    await (prisma as any).classRosterReview.create({
      data: {
        id: `crr-a-${suffix}`,
        classSectionId: testSectionAId,
        academicYearId: testYear1Id,
        homeroomTeacherId: hrTeacherId,
        status: 'DRAFT',
      },
    });

    console.log('Step 4 test fixtures ready.\n');

    // =========================================================================
    // TEST A — Seven Rows per Student
    // =========================================================================
    try {
      const rosterA = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const paperRows = calculationService.generatePaperRosterRows(rosterA.students);
      const stu1Group = paperRows.find((p) => p.studentId === stu1Id);

      assert(!!stu1Group, 'Student 1 group should exist in paper rows');
      assert(stu1Group!.periods.length === 7, `Student must produce exactly 7 rows, got ${stu1Group!.periods.length}`);

      const expectedPeriods = ['1st', '2nd', 'Ave1', '3rd', '4th', 'Ave2', 'Yearly'];
      const actualLabels = stu1Group!.periods.map((r) => r.period);

      for (let i = 0; i < 7; i++) {
        assert(actualLabels[i] === expectedPeriods[i], `Row ${i} label must be ${expectedPeriods[i]}, got ${actualLabels[i]}`);
      }

      results.push({ name: 'Test A — Seven Rows (1 student = exactly 7 academic rows: 1st, 2nd, Ave1, 3rd, 4th, Ave2, Yearly)', passed: true });
      console.log('✓ Test A PASS');
    } catch (e: any) {
      results.push({ name: 'Test A — Seven Rows', passed: false, error: e.message });
      console.error('✗ Test A FAIL:', e.message);
    }

    // =========================================================================
    // TEST B — Multiple Students: Two students produce 14 academic rows
    // =========================================================================
    try {
      const rosterA = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const twoStudents = rosterA.students.slice(0, 2);
      const paperRows = calculationService.generatePaperRosterRows(twoStudents);

      assert(paperRows.length === 2, `Expected 2 student groups, got ${paperRows.length}`);
      const totalAcademicRows = paperRows.reduce((acc, g) => acc + g.periods.length, 0);
      assert(totalAcademicRows === 14, `Two students must produce exactly 14 academic rows (excluding headers), got ${totalAcademicRows}`);

      results.push({ name: 'Test B — Multiple Students (Two students produce exactly 14 academic rows)', passed: true });
      console.log('✓ Test B PASS');
    } catch (e: any) {
      results.push({ name: 'Test B — Multiple Students', passed: false, error: e.message });
      console.error('✗ Test B FAIL:', e.message);
    }

    // =========================================================================
    // TEST C — Dynamic Subjects: Different sections with different subject counts
    // =========================================================================
    try {
      const rosterA = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const rosterB = await calculationService.calculateSectionRoster(testYear1Id, testSectionBId);

      assert(rosterA.subjects.length === 4, `Section A must have 4 dynamic subjects, got ${rosterA.subjects.length}`);
      assert(rosterB.subjects.length === 2, `Section B must have 2 dynamic subjects, got ${rosterB.subjects.length}`);

      const paperRowsA = calculationService.generatePaperRosterRows(rosterA.students);
      const paperRowsB = calculationService.generatePaperRosterRows(rosterB.students);

      // Verify each period row in Section A contains marks mapped for 4 subjects
      const rowA1 = paperRowsA[0].periods[0];
      const keysA = Object.keys(rowA1.scores);
      assert(keysA.length === 4, `Section A period row must have 4 subject scores, got ${keysA.length}`);

      // Verify each period row in Section B contains marks mapped for 2 subjects
      const rowB1 = paperRowsB[0].periods[0];
      const keysB = Object.keys(rowB1.scores);
      assert(keysB.length === 2, `Section B period row must have 2 subject scores, got ${keysB.length}`);

      results.push({ name: 'Test C — Dynamic Subjects (Sections with 4 and 2 subjects produce corresponding dynamic columns)', passed: true });
      console.log('✓ Test C PASS');
    } catch (e: any) {
      results.push({ name: 'Test C — Dynamic Subjects', passed: false, error: e.message });
      console.error('✗ Test C FAIL:', e.message);
    }

    // =========================================================================
    // TEST D — Calculation Consistency: Paper values match CalculationService
    // =========================================================================
    try {
      const rosterA = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const paperRows = calculationService.generatePaperRosterRows(rosterA.students);

      const stu1 = rosterA.students.find((s) => s.studentId === stu1Id)!;
      const group1 = paperRows.find((g) => g.studentId === stu1Id)!;

      // Check student-level summary consistency
      assert(group1.sum === stu1.sum, `Sum must match CalculationService: ${stu1.sum} vs ${group1.sum}`);
      assert(group1.average === stu1.average, `Average must match CalculationService: ${stu1.average} vs ${group1.average}`);
      assert(group1.rank === stu1.rank, `Rank must match CalculationService: ${stu1.rank} vs ${group1.rank}`);

      // Check subject-level consistency for each period
      const mathScore = stu1.subjectScores.find((sc) => sc.subjectId === subMath)!;
      const periodRowsMap = new Map(group1.periods.map((r) => [r.period, r.scores[subMath]]));

      assert(periodRowsMap.get('1st') === mathScore.term1, 'term1 must match CalculationService');
      assert(periodRowsMap.get('2nd') === mathScore.term2, 'term2 must match CalculationService');
      assert(periodRowsMap.get('Ave1') === mathScore.sem1Avg, 'sem1Avg must match CalculationService');
      assert(periodRowsMap.get('3rd') === mathScore.term3, 'term3 must match CalculationService');
      assert(periodRowsMap.get('4th') === mathScore.term4, 'term4 must match CalculationService');
      assert(periodRowsMap.get('Ave2') === mathScore.sem2Avg, 'sem2Avg must match CalculationService');
      assert(periodRowsMap.get('Yearly') === mathScore.yearlyAverage, 'yearlyAverage must match CalculationService');

      results.push({ name: 'Test D — Calculation Consistency (Paper values match CalculationService exactly without recalculation)', passed: true });
      console.log('✓ Test D PASS');
    } catch (e: any) {
      results.push({ name: 'Test D — Calculation Consistency', passed: false, error: e.message });
      console.error('✗ Test D FAIL:', e.message);
    }

    // =========================================================================
    // TEST E — Incomplete Student: Sum/Average/Rank are null (display —) & missing subjects flagged
    // =========================================================================
    try {
      const rosterA = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const paperRows = calculationService.generatePaperRosterRows(rosterA.students);

      const stu3 = rosterA.students.find((s) => s.studentId === stu3Id)!;
      const group3 = paperRows.find((g) => g.studentId === stu3Id)!;

      assert(stu3.isComplete === false, 'Student 3 must be marked incomplete');
      assert(stu3.sum === null, 'Incomplete student sum must be null');
      assert(stu3.average === null, 'Incomplete student average must be null');
      assert(stu3.rank === null, 'Incomplete student rank must be null');

      assert(group3.sum === null, 'Paper group sum must be null');
      assert(group3.average === null, 'Paper group average must be null');
      assert(group3.rank === null, 'Paper group rank must be null');

      assert(group3.missingSubjects.length > 0, 'Incomplete student must have missing subjects list');
      assert(group3.missingSubjects.some((m) => m.toLowerCase().includes('physics')), 'Missing subject list must include Physics');

      // Check missing subject period values are null
      for (const row of group3.periods) {
        assert(row.scores[subPhy] === null, `Missing subject Physics score for ${row.period} must be null`);
      }

      results.push({ name: 'Test E — Incomplete Student (Displays null/— for Sum/Average/Rank and identifies missing subjects)', passed: true });
      console.log('✓ Test E PASS');
    } catch (e: any) {
      results.push({ name: 'Test E — Incomplete Student', passed: false, error: e.message });
      console.error('✗ Test E FAIL:', e.message);
    }

    // =========================================================================
    // TEST F — Competition Ranking: Verify 1, 1, 3, 4, 4
    // =========================================================================
    try {
      const rosterA = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const completeStudents = rosterA.students
        .filter((s) => s.isComplete)
        .sort((a, b) => (b.average ?? 0) - (a.average ?? 0));

      const ranks = completeStudents.map((s) => s.rank);
      // Student 1 & 2 tie at 90 (Rank 1)
      // Student 4 has 85 (Rank 3)
      // Student 5 & 6 tie at 80 (Rank 4)
      const expectedRanks = [1, 1, 3, 4, 4];
      assert(
        JSON.stringify(ranks) === JSON.stringify(expectedRanks),
        `Expected competition ranks ${expectedRanks}, got ${ranks}`,
      );

      results.push({ name: 'Test F — Competition Ranking (Standard competition ranking 1, 1, 3, 4, 4 verified)', passed: true });
      console.log('✓ Test F PASS');
    } catch (e: any) {
      results.push({ name: 'Test F — Competition Ranking', passed: false, error: e.message });
      console.error('✗ Test F FAIL:', e.message);
    }

    // =========================================================================
    // TEST G — Draft Print Lock: DRAFT -> PRINT REJECTED
    // =========================================================================
    try {
      await (prisma as any).classRosterReview.update({
        where: { classSectionId_academicYearId: { classSectionId: testSectionAId, academicYearId: testYear1Id } },
        data: { status: 'DRAFT' },
      });

      let threw = false;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, hrTeacherUserId, 'TEACHER');
      } catch (e: any) {
        threw = true;
        assert(e instanceof BadRequestException, `Expected BadRequestException, got ${e?.constructor?.name}`);
        assert(e.message.includes('locked') || e.message.includes('APPROVED'), `Expected locked message, got: ${e.message}`);
      }
      assert(threw, 'Should have thrown BadRequestException for DRAFT status');

      results.push({ name: 'Test G — Draft Print Lock (DRAFT status rejects official print request with BadRequestException)', passed: true });
      console.log('✓ Test G PASS');
    } catch (e: any) {
      results.push({ name: 'Test G — Draft Print Lock', passed: false, error: e.message });
      console.error('✗ Test G FAIL:', e.message);
    }

    // =========================================================================
    // TEST H — Submitted Print Lock: SUBMITTED_TO_ADMIN -> PRINT REJECTED
    // =========================================================================
    try {
      await (prisma as any).classRosterReview.update({
        where: { classSectionId_academicYearId: { classSectionId: testSectionAId, academicYearId: testYear1Id } },
        data: { status: 'SUBMITTED_TO_ADMIN' },
      });

      let threw = false;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, hrTeacherUserId, 'TEACHER');
      } catch (e: any) {
        threw = true;
        assert(e instanceof BadRequestException, `Expected BadRequestException, got ${e?.constructor?.name}`);
        assert(e.message.includes('locked') || e.message.includes('APPROVED'), `Expected locked message, got: ${e.message}`);
      }
      assert(threw, 'Should have thrown BadRequestException for SUBMITTED_TO_ADMIN status');

      results.push({ name: 'Test H — Submitted Print Lock (SUBMITTED_TO_ADMIN rejects official print request)', passed: true });
      console.log('✓ Test H PASS');
    } catch (e: any) {
      results.push({ name: 'Test H — Submitted Print Lock', passed: false, error: e.message });
      console.error('✗ Test H FAIL:', e.message);
    }

    // =========================================================================
    // TEST I — Rejected Print Lock: REJECTED -> PRINT REJECTED
    // =========================================================================
    try {
      await (prisma as any).classRosterReview.update({
        where: { classSectionId_academicYearId: { classSectionId: testSectionAId, academicYearId: testYear1Id } },
        data: { status: 'REJECTED', rejectionReason: 'Incomplete marks detected' },
      });

      let threw = false;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, hrTeacherUserId, 'TEACHER');
      } catch (e: any) {
        threw = true;
        assert(e instanceof BadRequestException, `Expected BadRequestException, got ${e?.constructor?.name}`);
        assert(e.message.includes('locked') || e.message.includes('APPROVED'), `Expected locked message, got: ${e.message}`);
      }
      assert(threw, 'Should have thrown BadRequestException for REJECTED status');

      results.push({ name: 'Test I — Rejected Print Lock (REJECTED status rejects official print request)', passed: true });
      console.log('✓ Test I PASS');
    } catch (e: any) {
      results.push({ name: 'Test I — Rejected Print Lock', passed: false, error: e.message });
      console.error('✗ Test I FAIL:', e.message);
    }

    // =========================================================================
    // TEST J — Approved Print: APPROVED -> PRINT ALLOWED
    // =========================================================================
    try {
      await (prisma as any).classRosterReview.update({
        where: { classSectionId_academicYearId: { classSectionId: testSectionAId, academicYearId: testYear1Id } },
        data: { status: 'APPROVED', reviewedAt: new Date(), reviewedById: adminUserId },
      });

      const printData = await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, hrTeacherUserId, 'TEACHER');

      assert(!!printData, 'Print data must be returned');
      assert(printData.officialHeader.status === 'APPROVED', 'Header status must be APPROVED');
      assert(printData.officialHeader.documentTitle === 'STUDENT ACADEMIC ROSTER', 'Document title must be STUDENT ACADEMIC ROSTER');
      assert(printData.subjects.length === 4, 'Should contain 4 dynamic subjects');
      assert(printData.students.length === 6, 'Should contain 6 enrolled students');
      assert(printData.paperRows.length === 6, 'Should contain 6 student paper groups');

      results.push({ name: 'Test J — Approved Print (APPROVED status allows official print and returns full payload)', passed: true });
      console.log('✓ Test J PASS');
    } catch (e: any) {
      results.push({ name: 'Test J — Approved Print', passed: false, error: e.message });
      console.error('✗ Test J FAIL:', e.message);
    }

    // =========================================================================
    // TEST K — Academic Year Isolation: Wrong academic year cannot retrieve official roster
    // =========================================================================
    try {
      let threw = false;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear2Id, hrTeacherUserId, 'TEACHER');
      } catch (e: any) {
        threw = true;
        assert(e instanceof BadRequestException, `Expected BadRequestException, got ${e?.constructor?.name}`);
      }
      assert(threw, 'Should have rejected request with mismatched academic year');

      results.push({ name: 'Test K — Academic Year Isolation (Wrong academic year is rejected)', passed: true });
      console.log('✓ Test K PASS');
    } catch (e: any) {
      results.push({ name: 'Test K — Academic Year Isolation', passed: false, error: e.message });
      console.error('✗ Test K FAIL:', e.message);
    }

    // =========================================================================
    // TEST L — Section Isolation: Non-existent / unapproved section cannot retrieve official roster
    // =========================================================================
    try {
      let threw = false;
      try {
        // Section B has no approved review
        await reportsService.getOfficialPrintRoster(testSectionBId, testYear1Id, otherTeacherUserId, 'TEACHER');
      } catch (e: any) {
        threw = true;
        assert(e instanceof BadRequestException || e instanceof NotFoundException, `Expected rejection, got ${e?.constructor?.name}`);
      }
      assert(threw, 'Should have rejected section without approved roster review');

      results.push({ name: 'Test L — Section Isolation (Unapproved/other sections cannot retrieve official roster)', passed: true });
      console.log('✓ Test L PASS');
    } catch (e: any) {
      results.push({ name: 'Test L — Section Isolation', passed: false, error: e.message });
      console.error('✗ Test L FAIL:', e.message);
    }

    // =========================================================================
    // TEST M — Authorization: Unauthorized user cannot print
    // =========================================================================
    try {
      // 1. Other teacher (not homeroom teacher of Section A)
      let threwOtherTeacher = false;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, otherTeacherUserId, 'TEACHER');
      } catch (e: any) {
        threwOtherTeacher = true;
        assert(e instanceof ForbiddenException, `Expected ForbiddenException, got ${e?.constructor?.name}`);
      }
      assert(threwOtherTeacher, 'Other teacher should be forbidden from accessing Section A print roster');

      // 2. Student role
      let threwStudent = false;
      try {
        await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, `u-stu-1-${suffix}`, 'STUDENT');
      } catch (e: any) {
        threwStudent = true;
        assert(e instanceof ForbiddenException, `Expected ForbiddenException, got ${e?.constructor?.name}`);
      }
      assert(threwStudent, 'Student role should be forbidden from accessing official print roster');

      // 3. Admin is authorized
      const adminPrint = await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, adminUserId, 'ADMIN');
      assert(!!adminPrint, 'Admin should be authorized to retrieve official print roster');

      results.push({ name: 'Test M — Authorization (Unauthorized teacher and non-authorized roles are rejected with 403 Forbidden)', passed: true });
      console.log('✓ Test M PASS');
    } catch (e: any) {
      results.push({ name: 'Test M — Authorization', passed: false, error: e.message });
      console.error('✗ Test M FAIL:', e.message);
    }

    // =========================================================================
    // TEST N — No Mutation: Printing/calculation does not modify database state
    // =========================================================================
    try {
      // Snapshot state before operation
      const sectionBefore = await prisma.classSection.findUnique({ where: { id: testSectionAId } });
      const reviewBefore = await (prisma as any).classRosterReview.findUnique({
        where: { classSectionId_academicYearId: { classSectionId: testSectionAId, academicYearId: testYear1Id } },
      });
      const resultsCountBefore = await (prisma as any).subjectResult.count({
        where: { classSectionId: testSectionAId, academicYearId: testYear1Id },
      });

      // Execute official print retrieval
      await reportsService.getOfficialPrintRoster(testSectionAId, testYear1Id, hrTeacherUserId, 'TEACHER');

      // Verify state after operation
      const sectionAfter = await prisma.classSection.findUnique({ where: { id: testSectionAId } });
      const reviewAfter = await (prisma as any).classRosterReview.findUnique({
        where: { classSectionId_academicYearId: { classSectionId: testSectionAId, academicYearId: testYear1Id } },
      });
      const resultsCountAfter = await (prisma as any).subjectResult.count({
        where: { classSectionId: testSectionAId, academicYearId: testYear1Id },
      });

      assert(sectionAfter?.status === 'ACTIVE', 'ClassSection.status must remain ACTIVE');
      assert(sectionAfter?.updatedAt.getTime() === sectionBefore?.updatedAt.getTime(), 'ClassSection must not be mutated');
      assert(reviewAfter?.status === 'APPROVED', 'ClassRosterReview status must remain APPROVED');
      assert(reviewAfter?.updatedAt.getTime() === reviewBefore?.updatedAt.getTime(), 'ClassRosterReview must not be mutated');
      assert(resultsCountAfter === resultsCountBefore, 'SubjectResult count must not change');

      results.push({ name: 'Test N — No Mutation (Printing/calculation is strictly read-only and mutates zero rows)', passed: true });
      console.log('✓ Test N PASS');
    } catch (e: any) {
      results.push({ name: 'Test N — No Mutation', passed: false, error: e.message });
      console.error('✗ Test N FAIL:', e.message);
    }
  } catch (err: any) {
    console.error('Test suite setup error:', err);
  } finally {
    console.log('\nCleaning up isolated Step 4 test fixtures...');
    try {
      await (prisma as any).classRosterReview.deleteMany({
        where: { classSectionId: { in: [testSectionAId, testSectionBId] } },
      });
      await (prisma as any).subjectResult.deleteMany({
        where: { classSectionId: { in: [testSectionAId, testSectionBId] } },
      });
      await (prisma as any).sectionSubjectTeacher.deleteMany({
        where: { classSectionId: { in: [testSectionAId, testSectionBId] } },
      });
      await prisma.studentEnrollment.deleteMany({
        where: { classSectionId: { in: [testSectionAId, testSectionBId] } },
      });
      await prisma.classSection.deleteMany({
        where: { id: { in: [testSectionAId, testSectionBId] } },
      });
      await prisma.subject.deleteMany({
        where: { id: { in: allSubjectIds } },
      });
      await prisma.student.deleteMany({
        where: { id: { in: allStudentIds } },
      });
      await prisma.teacher.deleteMany({
        where: { id: { in: [hrTeacherId, otherTeacherId] } },
      });
      const allUserIds = [
        hrTeacherUserId,
        otherTeacherUserId,
        adminUserId,
        ...allStudentIds.map((_, i) => `u-stu-${i + 1}-${suffix}`),
      ];
      await prisma.user.deleteMany({
        where: { id: { in: allUserIds } },
      });
      await prisma.gradeLevel.deleteMany({
        where: { id: testGradeId },
      });
      await prisma.academicYear.deleteMany({
        where: { id: { in: [testYear1Id, testYear2Id] } },
      });
      console.log('Clean up complete.');
    } catch (cleanupErr: any) {
      console.error('Cleanup warning:', cleanupErr.message);
    }
    await prisma.$disconnect();
  }

  console.log('\n====================================================');
  console.log('STEP 4 TEST RESULTS SUMMARY');
  console.log('====================================================');
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  results.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
    if (!r.passed) console.log(`   Error: ${r.error}`);
  });
  console.log(`\nTOTAL: ${passed}/${total} passed`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
