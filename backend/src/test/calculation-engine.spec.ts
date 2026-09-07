import { PrismaClient } from '@prisma/client';
import { CalculationService } from '../modules/results/calculation.service';
import { PrismaService } from '../common/prisma/prisma.service';

const prisma = new PrismaClient();
const prismaService = prisma as unknown as PrismaService;
const calculationService = new CalculationService(prismaService);

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
  console.log('STEP 3: CALCULATION ENGINE TEST SUITE');
  console.log('====================================================\n');

  const suffix = Date.now().toString().slice(-6);
  const testYear1Id = `yr1-${suffix}`;
  const testYear2Id = `yr2-${suffix}`;
  const testGradeId = `grd-${suffix}`;
  const testSectionAId = `sec-a-${suffix}`;
  const testSectionBId = `sec-b-${suffix}`;

  const teacherId = `t-calc-${suffix}`;
  const teacherUserId = `u-tcalc-${suffix}`;

  const subMath = `sub-mat-${suffix}`;
  const subEng = `sub-eng-${suffix}`;
  const subPhy = `sub-phy-${suffix}`;
  const subChem = `sub-che-${suffix}`;
  const subBio = `sub-bio-${suffix}`;
  const subHist = `sub-his-${suffix}`;

  const stu1Id = `stu-1-${suffix}`;
  const stu2Id = `stu-2-${suffix}`;
  const stu3Id = `stu-3-${suffix}`;
  const stu4Id = `stu-4-${suffix}`;
  const stu5Id = `stu-5-${suffix}`;
  const stu6Id = `stu-6-${suffix}`;
  const stuSecBId = `stu-secb-${suffix}`;
  const stuUnenrolledId = `stu-un-${suffix}`;

  const allStudentIds = [stu1Id, stu2Id, stu3Id, stu4Id, stu5Id, stu6Id, stuSecBId, stuUnenrolledId];
  const allSubjectIds = [subMath, subEng, subPhy, subChem, subBio, subHist];

  try {
    console.log('Setting up isolated Step 3 test fixtures...');

    // 1. Academic Years
    await prisma.academicYear.createMany({
      data: [
        { id: testYear1Id, year: `2095/${suffix}`, startDate: new Date('2095-09-01'), endDate: new Date('2096-06-30'), isCurrent: false, updatedAt: new Date() },
        { id: testYear2Id, year: `2094/${suffix}`, startDate: new Date('2094-09-01'), endDate: new Date('2095-06-30'), isCurrent: false, updatedAt: new Date() },
      ],
    });

    // 2. Grade Level
    await prisma.gradeLevel.create({
      data: { id: testGradeId, name: `GradeCalc-${suffix}`, updatedAt: new Date() },
    });

    // 3. Teacher
    await prisma.user.create({
      data: {
        id: teacherUserId,
        loginId: `teacher-${suffix}`,
        password: 'hashed-password',
        role: 'TEACHER',
        name: 'Calc Test Teacher',
      },
    });
    await prisma.teacher.create({
      data: {
        id: teacherId,
        userId: teacherUserId,
        firstName: 'Calc',
        lastName: 'Teacher',
        staffId: `EMP-${suffix}`,
        updatedAt: new Date(),
      },
    });

    // 4. Class Sections
    await prisma.classSection.createMany({
      data: [
        { id: testSectionAId, name: `Section-A-${suffix}`, academicYearId: testYear1Id, gradeLevelId: testGradeId, teacherId, status: 'ACTIVE' },
        { id: testSectionBId, name: `Section-B-${suffix}`, academicYearId: testYear1Id, gradeLevelId: testGradeId, teacherId, status: 'ACTIVE' },
      ],
    });

    // 5. Subjects
    await prisma.subject.createMany({
      data: [
        { id: subMath, name: `Mathematics-${suffix}`, code: `MAT-${suffix}` },
        { id: subEng, name: `English-${suffix}`, code: `ENG-${suffix}` },
        { id: subPhy, name: `Physics-${suffix}`, code: `PHY-${suffix}` },
        { id: subChem, name: `Chemistry-${suffix}`, code: `CHE-${suffix}` },
        { id: subBio, name: `Biology-${suffix}`, code: `BIO-${suffix}` },
        { id: subHist, name: `History-${suffix}`, code: `HIS-${suffix}` },
      ],
    });

    // 6. Dynamic Section-Subject Assignments:
    // Section A has 4 required subjects: Math, English, Physics, Chemistry
    await (prisma as any).sectionSubjectTeacher.createMany({
      data: [
        { classSectionId: testSectionAId, subjectId: subMath, teacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionAId, subjectId: subEng, teacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionAId, subjectId: subPhy, teacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionAId, subjectId: subChem, teacherId, academicYearId: testYear1Id },
      ],
    });

    // Section B has 5 required subjects: Math, English, Biology, Chemistry, History
    await (prisma as any).sectionSubjectTeacher.createMany({
      data: [
        { classSectionId: testSectionBId, subjectId: subMath, teacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionBId, subjectId: subEng, teacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionBId, subjectId: subBio, teacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionBId, subjectId: subChem, teacherId, academicYearId: testYear1Id },
        { classSectionId: testSectionBId, subjectId: subHist, teacherId, academicYearId: testYear1Id },
      ],
    });

    // 7. Students & Enrollments in Section A
    for (let i = 0; i < allStudentIds.length; i++) {
      const sId = allStudentIds[i];
      const uId = `u-${sId}`;
      await prisma.user.create({
        data: { id: uId, loginId: `login-${sId}`, password: 'hashed-password', role: 'STUDENT', name: `Student ${i + 1}` },
      });
      await prisma.student.create({
        data: {
          id: sId,
          userId: uId,
          admissionNo: `ADM-${suffix}-${i + 1}`,
          firstName: `Student${i + 1}`,
          lastName: `Test${suffix}`,
          gender: i % 2 === 0 ? 'M' : 'F',
          classSectionId: testSectionAId,
          updatedAt: new Date(),
        },
      });
    }

    // Enroll students 1 to 6 in Section A for Year 1
    for (let i = 0; i < 6; i++) {
      await prisma.studentEnrollment.create({
        data: {
          studentId: allStudentIds[i],
          classSectionId: testSectionAId,
          academicYearId: testYear1Id,
          gradeLevelId: testGradeId,
          status: 'ACTIVE',
        },
      });
    }

    console.log('Test fixtures initialized successfully.\n');

    // =========================================================================
    // TEST A: Subject Ave1
    // Given: Term1 = 70, Term2 = 80 -> expect Ave1 = 75
    // =========================================================================
    try {
      const ave1 = calculationService.calculateAve1(70, 80);
      assert(ave1 === 75, `Expected Ave1 = 75, got ${ave1}`);
      results.push({ name: 'Test A — Subject Ave1 ((70 + 80) / 2 = 75)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test A — Subject Ave1 ((70 + 80) / 2 = 75)', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST B: Subject Ave2
    // Given: Term3 = 90, Term4 = 100 -> expect Ave2 = 95
    // =========================================================================
    try {
      const ave2 = calculationService.calculateAve2(90, 100);
      assert(ave2 === 95, `Expected Ave2 = 95, got ${ave2}`);
      results.push({ name: 'Test B — Subject Ave2 ((90 + 100) / 2 = 95)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test B — Subject Ave2 ((90 + 100) / 2 = 95)', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST C: Yearly Average
    // Given: Ave1 = 75, Ave2 = 95 -> expect YearlyAverage = 85
    // =========================================================================
    try {
      const yearly = calculationService.calculateYearlyAverage(75, 95);
      assert(yearly === 85, `Expected YearlyAverage = 85, got ${yearly}`);
      results.push({ name: 'Test C — Yearly Average ((75 + 95) / 2 = 85)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test C — Yearly Average ((75 + 95) / 2 = 85)', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST D: Subject Calculation End-to-End
    // Given: Term1 = 70, Term2 = 80, Term3 = 90, Term4 = 100
    // expect: Ave1 = 75, Ave2 = 95, YearlyAverage = 85
    // =========================================================================
    try {
      const subScores = calculationService.calculateSubjectScores(70, 80, 90, 100);
      assert(subScores.sem1Avg === 75, `Expected sem1Avg = 75, got ${subScores.sem1Avg}`);
      assert(subScores.sem2Avg === 95, `Expected sem2Avg = 95, got ${subScores.sem2Avg}`);
      assert(subScores.yearlyAverage === 85, `Expected yearlyAverage = 85, got ${subScores.yearlyAverage}`);
      assert(subScores.isComplete === true, 'Expected isComplete = true');
      results.push({ name: 'Test D — Subject Calculation End-to-End', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test D — Subject Calculation End-to-End', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST E: Class Sum
    // Given: Math = 80, English = 70, Physics = 90, Chemistry = 60 -> expect Sum = 300
    // =========================================================================
    try {
      const sum = calculationService.calculateClassSum([80, 70, 90, 60]);
      assert(sum === 300, `Expected Sum = 300, got ${sum}`);
      results.push({ name: 'Test E — Class Sum (80 + 70 + 90 + 60 = 300)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test E — Class Sum (80 + 70 + 90 + 60 = 300)', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST F: Class Average
    // Given: Sum = 300, Required subjects = 4 -> expect Average = 75
    // =========================================================================
    try {
      const avg = calculationService.calculateClassAverage(300, 4);
      assert(avg === 75, `Expected Average = 75, got ${avg}`);
      results.push({ name: 'Test F — Class Average (300 / 4 = 75)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test F — Class Average (300 / 4 = 75)', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST G: Missing Required Subject
    // Given: Math = complete, English = complete, Physics = missing, Chemistry = complete
    // expect: isComplete = false, missingSubjects includes "Physics", sum = null, average = null, rank = null
    // =========================================================================
    try {
      // Seed student 1 with all 4 terms for Math, English, Chemistry, but NOT Physics
      const terms = ['TERM_1', 'TERM_2', 'TERM_3', 'TERM_4'];
      for (const t of terms) {
        await (prisma as any).subjectResult.createMany({
          data: [
            { studentId: stu1Id, classSectionId: testSectionAId, academicYearId: testYear1Id, subjectId: subMath, term: t, marks: 80, status: 'SUBMITTED' },
            { studentId: stu1Id, classSectionId: testSectionAId, academicYearId: testYear1Id, subjectId: subEng, term: t, marks: 70, status: 'SUBMITTED' },
            { studentId: stu1Id, classSectionId: testSectionAId, academicYearId: testYear1Id, subjectId: subChem, term: t, marks: 60, status: 'SUBMITTED' },
          ],
        });
      }

      const rosterResult = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const student1 = rosterResult.students.find((s) => s.studentId === stu1Id);

      assert(!!student1, 'Student 1 not found in calculated roster');
      assert(student1!.isComplete === false, 'Student 1 should be incomplete due to missing Physics');
      assert(student1!.missingSubjects.some((name) => name.includes('Physics')), 'Missing subjects should include Physics');
      assert(student1!.sum === null, `Expected sum = null, got ${student1!.sum}`);
      assert(student1!.average === null, `Expected average = null, got ${student1!.average}`);
      assert(student1!.rank === null, `Expected rank = null, got ${student1!.rank}`);
      results.push({ name: 'Test G — Missing Required Subject marked INCOMPLETE (no silent average)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test G — Missing Required Subject marked INCOMPLETE (no silent average)', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST H: Missing Required Term
    // If Physics has Term 1, Term 2, Term 3, but Term 4 is missing,
    // expect Physics/yearly calculation to be incomplete and student has average = null, rank = null
    // =========================================================================
    try {
      // Add Term 1, 2, 3 for Physics to Student 1
      await (prisma as any).subjectResult.createMany({
        data: [
          { studentId: stu1Id, classSectionId: testSectionAId, academicYearId: testYear1Id, subjectId: subPhy, term: 'TERM_1', marks: 90, status: 'SUBMITTED' },
          { studentId: stu1Id, classSectionId: testSectionAId, academicYearId: testYear1Id, subjectId: subPhy, term: 'TERM_2', marks: 90, status: 'SUBMITTED' },
          { studentId: stu1Id, classSectionId: testSectionAId, academicYearId: testYear1Id, subjectId: subPhy, term: 'TERM_3', marks: 90, status: 'SUBMITTED' },
        ],
      });

      const rosterResult = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const student1 = rosterResult.students.find((s) => s.studentId === stu1Id);

      assert(student1!.isComplete === false, 'Student 1 should still be incomplete with Term 4 missing');
      assert(student1!.missingSubjects.some((name) => name.includes('Physics')), 'Missing subjects should still include Physics');
      const phyScore = student1!.subjectScores.find((sc) => sc.subjectId === subPhy);
      assert(phyScore!.yearlyAverage === null, 'Physics yearlyAverage must be null when Term 4 is missing');
      assert(student1!.average === null, 'Student average must be null when term is missing');
      assert(student1!.rank === null, 'Student rank must be null when term is missing');
      results.push({ name: 'Test H — Missing Required Term marks subject and student INCOMPLETE', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test H — Missing Required Term marks subject and student INCOMPLETE', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST I: Dynamic Subjects
    // Verify that Section A has 4 required subjects and Section B has 5 required subjects from DB
    // No hardcoded subject list!
    // =========================================================================
    try {
      const reqA = await calculationService.getRequiredSubjects(testSectionAId, testYear1Id);
      const reqB = await calculationService.getRequiredSubjects(testSectionBId, testYear1Id);

      assert(reqA.length === 4, `Expected Section A to have 4 required subjects, got ${reqA.length}`);
      assert(reqB.length === 5, `Expected Section B to have 5 required subjects, got ${reqB.length}`);

      const namesA = reqA.map((s) => s.name);
      const namesB = reqB.map((s) => s.name);

      assert(namesA.some((n) => n.includes('Physics')), 'Section A should include Physics');
      assert(!namesA.some((n) => n.includes('Biology')), 'Section A should not include Biology');

      assert(namesB.some((n) => n.includes('Biology')), 'Section B should include Biology');
      assert(namesB.some((n) => n.includes('History')), 'Section B should include History');
      assert(!namesB.some((n) => n.includes('Physics')), 'Section B should not include Physics');

      results.push({ name: 'Test I — Dynamic Subjects determined from database relationships', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test I — Dynamic Subjects determined from database relationships', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST J: Competition Ranking
    // Given: 95, 95, 90, 85, 85, 80 -> expect 1, 1, 3, 4, 4, 6
    // =========================================================================
    try {
      const mockStudents = [
        { average: 95, isComplete: true, id: '1' },
        { average: 95, isComplete: true, id: '2' },
        { average: 90, isComplete: true, id: '3' },
        { average: 85, isComplete: true, id: '4' },
        { average: 85, isComplete: true, id: '5' },
        { average: 80, isComplete: true, id: '6' },
      ];
      const ranked = calculationService.assignCompetitionRanks(mockStudents);
      const ranks = ranked.map((s) => s.rank);

      assert(
        JSON.stringify(ranks) === JSON.stringify([1, 1, 3, 4, 4, 6]),
        `Expected ranks [1, 1, 3, 4, 4, 6], got ${JSON.stringify(ranks)}`,
      );
      results.push({ name: 'Test J — Competition Ranking (1, 1, 3, 4, 4, 6)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test J — Competition Ranking (1, 1, 3, 4, 4, 6)', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST K: Incomplete Students Not Ranked
    // Given: 95 complete, 90 complete, 85 incomplete, 80 complete
    // expect: 95 -> rank 1, 90 -> rank 2, 85 -> rank null, 80 -> rank 3
    // =========================================================================
    try {
      const mockStudents = [
        { average: 95, isComplete: true, id: '1' },
        { average: 90, isComplete: true, id: '2' },
        { average: 85, isComplete: false, id: '3' },
        { average: 80, isComplete: true, id: '4' },
      ];
      const ranked = calculationService.assignCompetitionRanks(mockStudents);

      assert(ranked[0].rank === 1, `Expected 95 -> rank 1, got ${ranked[0].rank}`);
      assert(ranked[1].rank === 2, `Expected 90 -> rank 2, got ${ranked[1].rank}`);
      assert(ranked[2].rank === null, `Expected 85 incomplete -> rank null, got ${ranked[2].rank}`);
      assert(ranked[3].rank === 3, `Expected 80 -> rank 3, got ${ranked[3].rank}`);

      results.push({ name: 'Test K — Incomplete Students are NOT ranked (rank = null)', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test K — Incomplete Students are NOT ranked (rank = null)', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST L: Ranking Ties
    // Verify equal averages always produce equal ranks
    // =========================================================================
    try {
      const mockStudents = [
        { average: 88.5, isComplete: true, id: '1' },
        { average: 88.5, isComplete: true, id: '2' },
        { average: 88.5, isComplete: true, id: '3' },
        { average: 75.0, isComplete: true, id: '4' },
      ];
      const ranked = calculationService.assignCompetitionRanks(mockStudents);

      assert(ranked[0].rank === 1, 'First tie student should be rank 1');
      assert(ranked[1].rank === 1, 'Second tie student should be rank 1');
      assert(ranked[2].rank === 1, 'Third tie student should be rank 1');
      assert(ranked[3].rank === 4, `Fourth student after 3-way tie should be rank 4, got ${ranked[3].rank}`);

      results.push({ name: 'Test L — Ranking Ties produce equal ranks and correct next rank', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test L — Ranking Ties produce equal ranks and correct next rank', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST M: Academic Year Isolation
    // Verify 2024/2025 results never enter the 2025/2026 calculation
    // =========================================================================
    try {
      // Create a result for Student 2 in testYear2Id (Year 2024)
      await (prisma as any).subjectResult.create({
        data: {
          studentId: stu2Id,
          classSectionId: testSectionAId,
          academicYearId: testYear2Id,
          subjectId: subMath,
          term: 'TERM_1',
          marks: 100,
          status: 'SUBMITTED',
        },
      });

      // Calculate for Year 1 (2025)
      const rosterYear1 = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const student2InYear1 = rosterYear1.students.find((s) => s.studentId === stu2Id);

      const mathScoreInYear1 = student2InYear1?.subjectScores.find((sc) => sc.subjectId === subMath);
      assert(mathScoreInYear1?.term1 === null, 'Year 2 results must not leak into Year 1 calculation');

      results.push({ name: 'Test M — Academic Year Isolation enforced', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test M — Academic Year Isolation enforced', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST N: Section Isolation
    // Verify Class A results never enter Class B calculations
    // =========================================================================
    try {
      // Enroll dedicated Section B student in Section B for Year 1
      await prisma.studentEnrollment.create({
        data: {
          studentId: stuSecBId,
          classSectionId: testSectionBId,
          academicYearId: testYear1Id,
          gradeLevelId: testGradeId,
          status: 'ACTIVE',
        },
      });

      // Create a result for Student SecB specifically in Section B
      await (prisma as any).subjectResult.create({
        data: {
          studentId: stuSecBId,
          classSectionId: testSectionBId,
          academicYearId: testYear1Id,
          subjectId: subBio,
          term: 'TERM_1',
          marks: 92,
          status: 'SUBMITTED',
        },
      });

      // Calculate Section A: Section B student must NOT appear in Section A
      const rosterA = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const studentBInA = rosterA.students.find((s) => s.studentId === stuSecBId);
      assert(studentBInA === undefined, 'Section B student must not appear in Section A calculation');

      // Calculate Section B: Section A student must NOT appear in Section B
      const rosterB = await calculationService.calculateSectionRoster(testYear1Id, testSectionBId);
      const studentAInB = rosterB.students.find((s) => s.studentId === stu1Id);
      assert(studentAInB === undefined, 'Section A student must not appear in Section B calculation');
      assert(rosterB.students.some((s) => s.studentId === stuSecBId), 'Section B student must appear in Section B calculation');

      results.push({ name: 'Test N — Section Isolation enforced', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test N — Section Isolation enforced', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST O: Enrollment Isolation
    // Verify only students enrolled in the requested class/year are included
    // =========================================================================
    try {
      const rosterA = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const studentIdsInRoster = rosterA.students.map((s) => s.studentId);

      assert(!studentIdsInRoster.includes(stuUnenrolledId), 'Unenrolled student must not be included in class calculation');
      assert(studentIdsInRoster.includes(stu1Id), 'Enrolled student 1 must be included');

      results.push({ name: 'Test O — Enrollment Isolation enforced', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test O — Enrollment Isolation enforced', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST P: Draft Results Excluded
    // A DRAFT result must not count as a finalized result
    // =========================================================================
    try {
      // Add Term 4 for Student 1 as DRAFT
      await (prisma as any).subjectResult.create({
        data: {
          studentId: stu1Id,
          classSectionId: testSectionAId,
          academicYearId: testYear1Id,
          subjectId: subPhy,
          term: 'TERM_4',
          marks: 90,
          status: 'DRAFT',
        },
      });

      const rosterResult = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const student1 = rosterResult.students.find((s) => s.studentId === stu1Id);
      const phyScore = student1?.subjectScores.find((sc) => sc.subjectId === subPhy);

      assert(phyScore?.term4 === null, 'DRAFT result must NOT count as a finalized term score');
      assert(student1?.isComplete === false, 'Student must remain INCOMPLETE when a term is only in DRAFT');

      results.push({ name: 'Test P — Draft Results Excluded from final calculation', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test P — Draft Results Excluded from final calculation', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST Q: Returned Results Excluded
    // A RETURNED_FOR_CORRECTION result must not count as a finalized result
    // =========================================================================
    try {
      // Update the DRAFT result to RETURNED_FOR_CORRECTION
      await (prisma as any).subjectResult.update({
        where: {
          studentId_subjectId_classSectionId_academicYearId_term: {
            studentId: stu1Id,
            classSectionId: testSectionAId,
            academicYearId: testYear1Id,
            subjectId: subPhy,
            term: 'TERM_4',
          },
        },
        data: { status: 'RETURNED_FOR_CORRECTION' },
      });

      const rosterResult = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const student1 = rosterResult.students.find((s) => s.studentId === stu1Id);
      const phyScore = student1?.subjectScores.find((sc) => sc.subjectId === subPhy);

      assert(phyScore?.term4 === null, 'RETURNED_FOR_CORRECTION result must NOT count as a finalized score');
      assert(student1?.isComplete === false, 'Student must remain INCOMPLETE when result is RETURNED_FOR_CORRECTION');

      results.push({ name: 'Test Q — Returned Results Excluded from final calculation', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test Q — Returned Results Excluded from final calculation', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST R: Submitted Results Included
    // When updated to SUBMITTED, the term score is accepted and student completes
    // =========================================================================
    try {
      // Update Term 4 to SUBMITTED
      await (prisma as any).subjectResult.update({
        where: {
          studentId_subjectId_classSectionId_academicYearId_term: {
            studentId: stu1Id,
            classSectionId: testSectionAId,
            academicYearId: testYear1Id,
            subjectId: subPhy,
            term: 'TERM_4',
          },
        },
        data: { status: 'SUBMITTED' },
      });

      const rosterResult = await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);
      const student1 = rosterResult.students.find((s) => s.studentId === stu1Id);
      const phyScore = student1?.subjectScores.find((sc) => sc.subjectId === subPhy);

      assert(phyScore?.term4 === 90, 'SUBMITTED result must be included');
      assert(phyScore?.isComplete === true, 'Physics should now be complete');
      assert(student1?.isComplete === true, 'Student 1 should now be complete');
      assert(typeof student1?.sum === 'number', 'Student 1 sum should be a valid number');
      assert(typeof student1?.average === 'number', 'Student 1 average should be a valid number');
      assert(typeof student1?.rank === 'number', 'Student 1 rank should be assigned');

      results.push({ name: 'Test R — Submitted Results Included as finalized results', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test R — Submitted Results Included as finalized results', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST S: No Mutation
    // Calculation must not modify SubjectResult, ClassRosterReview, or ClassSection
    // =========================================================================
    try {
      const sectionBefore = await prisma.classSection.findUnique({ where: { id: testSectionAId } });
      const resultsCountBefore = await (prisma as any).subjectResult.count({ where: { classSectionId: testSectionAId } });

      // Run calculation
      await calculationService.calculateSectionRoster(testYear1Id, testSectionAId);

      const sectionAfter = await prisma.classSection.findUnique({ where: { id: testSectionAId } });
      const resultsCountAfter = await (prisma as any).subjectResult.count({ where: { classSectionId: testSectionAId } });

      assert(sectionBefore?.status === sectionAfter?.status, 'ClassSection.status was mutated');
      assert(sectionBefore?.updatedAt.getTime() === sectionAfter?.updatedAt.getTime(), 'ClassSection updatedAt was modified');
      assert(resultsCountBefore === resultsCountAfter, 'SubjectResult count changed during calculation');

      results.push({ name: 'Test S — Pure Read-Only: No database mutation occurs during calculation', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test S — Pure Read-Only: No database mutation occurs during calculation', passed: false, error: err.message });
    }

    // =========================================================================
    // TEST T: Step 2 Regression Verification
    // Ensure that calculation service changes did not disrupt Step 2 correction models or functions
    // =========================================================================
    try {
      // Create a test correction request to verify the model and relations are intact
      const req = await (prisma as any).subjectCorrectionRequest.create({
        data: {
          classSectionId: testSectionAId,
          academicYearId: testYear1Id,
          subjectId: subMath,
          term: 'TERM_1',
          requestedById: teacherUserId,
          reason: 'Test correction request from Step 3 suite',
          status: 'PENDING',
        },
      });
      assert(req.id !== undefined, 'Correction request creation failed');
      assert(req.status === 'PENDING', 'Expected status PENDING');

      await (prisma as any).subjectCorrectionRequest.delete({ where: { id: req.id } });
      results.push({ name: 'Test T — Step 2 Regression: SubjectCorrectionRequest model and lifecycle intact', passed: true });
    } catch (err: any) {
      results.push({ name: 'Test T — Step 2 Regression: SubjectCorrectionRequest model and lifecycle intact', passed: false, error: err.message });
    }

  } finally {
    console.log('\nCleaning up isolated Step 3 test fixtures...');
    try {
      await (prisma as any).subjectCorrectionRequest.deleteMany({ where: { classSectionId: { in: [testSectionAId, testSectionBId] } } });
      await (prisma as any).classRosterReview.deleteMany({ where: { classSectionId: { in: [testSectionAId, testSectionBId] } } });
      await (prisma as any).subjectResult.deleteMany({ where: { classSectionId: { in: [testSectionAId, testSectionBId] } } });
      await (prisma as any).sectionSubjectTeacher.deleteMany({ where: { classSectionId: { in: [testSectionAId, testSectionBId] } } });
      await prisma.studentEnrollment.deleteMany({ where: { classSectionId: { in: [testSectionAId, testSectionBId] } } });
      await prisma.student.deleteMany({ where: { id: { in: allStudentIds } } });
      await prisma.classSection.deleteMany({ where: { id: { in: [testSectionAId, testSectionBId] } } });
      await prisma.subject.deleteMany({ where: { id: { in: allSubjectIds } } });
      await prisma.gradeLevel.deleteMany({ where: { id: testGradeId } });
      await prisma.teacher.deleteMany({ where: { id: teacherId } });
      await prisma.user.deleteMany({ where: { id: { in: [teacherUserId, ...allStudentIds.map((id) => `u-${id}`)] } } });
      await prisma.academicYear.deleteMany({ where: { id: { in: [testYear1Id, testYear2Id] } } });
      console.log('Step 3 test cleanup completed successfully.');
    } catch (cleanupErr: any) {
      console.error('Cleanup error:', cleanupErr.message);
    }
  }

  // Print results
  console.log('\n====================================================');
  console.log('STEP 3 TEST EXECUTION SUMMARY');
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
