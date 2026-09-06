import { PrismaClient } from '@prisma/client';
import { CalculationService } from '../modules/results/calculation.service';
import { ReportsService } from '../modules/reports/reports.service';
import { PrismaService } from '../common/prisma/prisma.service';

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
  console.log('STUDENT AGE CALCULATION & ROSTER INTEGRATION TESTS');
  console.log('====================================================\n');

  // ───────────────────────────────────────────────────────────────────────────
  // PART 1: PURE AGE CALCULATION UNIT TESTS
  // ───────────────────────────────────────────────────────────────────────────

  // Test A — Birthday already occurred
  try {
    const age = calculationService.calculateAge('2010-09-05', '2026-09-06');
    assert(age === 16, `Expected age 16, got ${age}`);
    results.push({ name: 'Test A — Birthday already occurred (2010-09-05 -> 16)', passed: true });
    console.log('✓ Test A passed');
  } catch (err: any) {
    results.push({ name: 'Test A — Birthday already occurred', passed: false, error: err.message });
    console.error('✗ Test A failed:', err.message);
  }

  // Test B — Birthday has not occurred
  try {
    const age = calculationService.calculateAge('2010-09-10', '2026-09-06');
    assert(age === 15, `Expected age 15, got ${age}`);
    results.push({ name: 'Test B — Birthday has not occurred (2010-09-10 -> 15)', passed: true });
    console.log('✓ Test B passed');
  } catch (err: any) {
    results.push({ name: 'Test B — Birthday has not occurred', passed: false, error: err.message });
    console.error('✗ Test B failed:', err.message);
  }

  // Test C — Exact birthday
  try {
    const age = calculationService.calculateAge('2010-09-06', '2026-09-06');
    assert(age === 16, `Expected age 16, got ${age}`);
    results.push({ name: 'Test C — Exact birthday (2010-09-06 -> 16)', passed: true });
    console.log('✓ Test C passed');
  } catch (err: any) {
    results.push({ name: 'Test C — Exact birthday', passed: false, error: err.message });
    console.error('✗ Test C failed:', err.message);
  }

  // Test D — Missing DOB
  try {
    const ageNull = calculationService.calculateAge(null, '2026-09-06');
    const ageUndef = calculationService.calculateAge(undefined, '2026-09-06');
    const ageEmpty = calculationService.calculateAge('', '2026-09-06');
    assert(ageNull === null, `Expected null for null DOB, got ${ageNull}`);
    assert(ageUndef === null, `Expected null for undefined DOB, got ${ageUndef}`);
    assert(ageEmpty === null, `Expected null for empty string DOB, got ${ageEmpty}`);
    results.push({ name: 'Test D — Missing DOB returns null (renders as —)', passed: true });
    console.log('✓ Test D passed');
  } catch (err: any) {
    results.push({ name: 'Test D — Missing DOB', passed: false, error: err.message });
    console.error('✗ Test D failed:', err.message);
  }

  // Test E — Leap-year birthday
  try {
    // Born Feb 29, 2012
    const ageBefore = calculationService.calculateAge('2012-02-29', '2026-02-28');
    assert(ageBefore === 13, `Expected age 13 on Feb 28, got ${ageBefore}`);

    const ageAfter = calculationService.calculateAge('2012-02-29', '2026-03-01');
    assert(ageAfter === 14, `Expected age 14 on Mar 1, got ${ageAfter}`);

    const ageExactLeap = calculationService.calculateAge('2012-02-29', '2016-02-29');
    assert(ageExactLeap === 4, `Expected age 4 on Feb 29 2016, got ${ageExactLeap}`);

    results.push({ name: 'Test E — Leap-year birthday handles Feb 28, Mar 1, and Feb 29 leap years', passed: true });
    console.log('✓ Test E passed');
  } catch (err: any) {
    results.push({ name: 'Test E — Leap-year birthday', passed: false, error: err.message });
    console.error('✗ Test E failed:', err.message);
  }

  // Test F — Timezone & format invariance
  try {
    // Date object at UTC midnight (how Prisma reads DOB from Postgres)
    const prismaDate = new Date('2010-09-05T00:00:00.000Z');
    const refDateObj = new Date('2026-09-06T00:00:00.000Z');

    const ageFromDate = calculationService.calculateAge(prismaDate, refDateObj);
    assert(ageFromDate === 16, `Expected 16 from Date objects, got ${ageFromDate}`);

    // Year end/beginning boundaries
    const ageYearEnd = calculationService.calculateAge('2010-12-31', '2026-01-01');
    assert(ageYearEnd === 15, `Expected 15 before Dec 31 birthday, got ${ageYearEnd}`);

    const ageYearEndReached = calculationService.calculateAge('2010-12-31', '2026-12-31');
    assert(ageYearEndReached === 16, `Expected 16 on Dec 31 birthday, got ${ageYearEndReached}`);

    results.push({ name: 'Test F — Timezone safety: Date objects and string inputs produce identical calendar age', passed: true });
    console.log('✓ Test F passed');
  } catch (err: any) {
    results.push({ name: 'Test F — Timezone safety', passed: false, error: err.message });
    console.error('✗ Test F failed:', err.message);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PART 2: DATABASE ROSTER INTEGRATION TESTS
  // ───────────────────────────────────────────────────────────────────────────

  const suffix = Date.now().toString().slice(-6);
  const testYearId = `yr-age-${suffix}`;
  const testGradeId = `grd-age-${suffix}`;
  const testSectionId = `sec-age-${suffix}`;
  const hrTeacherUserId = `u-hr-age-${suffix}`;
  const hrTeacherId = `t-hr-age-${suffix}`;
  const adminUserId = `u-adm-age-${suffix}`;

  const sub1Id = `sub-1-age-${suffix}`;
  const sub2Id = `sub-2-age-${suffix}`;

  const stu1Id = `stu-1-age-${suffix}`; // DOB: 2010-09-05 (16 if today >= Sept 5, 2026)
  const stu2Id = `stu-2-age-${suffix}`; // DOB: null
  const stu3Id = `stu-3-age-${suffix}`; // DOB: 2012-02-29 (leap year)

  try {
    // 1. Create Academic Year
    await prisma.academicYear.create({
      data: {
        id: testYearId,
        year: `2025/2026-AGE-${suffix}`,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-06-30'),
        isCurrent: true,
        updatedAt: new Date(),
      },
    });

    // 2. Create Grade Level
    await prisma.gradeLevel.create({
      data: {
        id: testGradeId,
        name: `Grade 10-Age-${suffix}`,
        gradeNumber: 10,
        status: 'ACTIVE',
      },
    });

    // 3. Create Homeroom Teacher & Admin Users
    await prisma.user.createMany({
      data: [
        {
          id: hrTeacherUserId,
          loginId: `hr_age_${suffix}`,
          name: 'AgeHomeroom Teacher',
          email: `hr-age-${suffix}@school.com`,
          password: 'hash',
          role: 'TEACHER',
        },
        {
          id: adminUserId,
          loginId: `adm_age_${suffix}`,
          name: 'AgeAdmin User',
          email: `admin-age-${suffix}@school.com`,
          password: 'hash',
          role: 'ADMIN',
        },
      ],
    });

    await prisma.teacher.create({
      data: {
        id: hrTeacherId,
        userId: hrTeacherUserId,
        firstName: 'AgeHomeroom',
        lastName: 'Teacher',
        updatedAt: new Date(),
      },
    });

    // 4. Create Class Section
    await prisma.classSection.create({
      data: {
        id: testSectionId,
        name: `Section-Age-${suffix}`,
        gradeLevelId: testGradeId,
        academicYearId: testYearId,
        teacherId: hrTeacherId,
        status: 'ACTIVE',
        capacity: 40,
        updatedAt: new Date(),
      },
    });

    // 5. Create Subjects & section assignments
    await prisma.subject.createMany({
      data: [
        { id: sub1Id, name: `Mathematics-${suffix}`, code: `MTH-${suffix}`, updatedAt: new Date() },
        { id: sub2Id, name: `English-${suffix}`, code: `ENG-${suffix}`, updatedAt: new Date() },
      ],
    });

    await (prisma as any).sectionSubjectTeacher.createMany({
      data: [
        { classSectionId: testSectionId, subjectId: sub1Id, teacherId: hrTeacherId, academicYearId: testYearId },
        { classSectionId: testSectionId, subjectId: sub2Id, teacherId: hrTeacherId, academicYearId: testYearId },
      ],
    });

    // 6. Create Students with different DOBs
    const stuUsers = [
      { id: `u-s1-age-${suffix}`, loginId: `stu_1_age_${suffix}`, email: `s1-age-${suffix}@test.com`, firstName: 'Alice', lastName: 'AgeTested' },
      { id: `u-s2-age-${suffix}`, loginId: `stu_2_age_${suffix}`, email: `s2-age-${suffix}@test.com`, firstName: 'Bob', lastName: 'NoDob' },
      { id: `u-s3-age-${suffix}`, loginId: `stu_3_age_${suffix}`, email: `s3-age-${suffix}@test.com`, firstName: 'Charlie', lastName: 'LeapBorn' },
    ];
    await prisma.user.createMany({
      data: stuUsers.map((u) => ({
        id: u.id,
        loginId: u.loginId,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        password: 'hash',
        role: 'STUDENT',
      })),
    });

    await prisma.student.create({
      data: {
        id: stu1Id,
        userId: stuUsers[0].id,
        admissionNo: `ADM-1-AGE-${suffix}`,
        firstName: 'Alice',
        lastName: 'AgeTested',
        gender: 'F',
        dob: new Date('2010-09-05T00:00:00.000Z'),
        updatedAt: new Date(),
      },
    });

    await prisma.student.create({
      data: {
        id: stu2Id,
        userId: stuUsers[1].id,
        admissionNo: `ADM-2-AGE-${suffix}`,
        firstName: 'Bob',
        lastName: 'NoDob',
        gender: 'M',
        dob: null, // missing DOB
        updatedAt: new Date(),
      },
    });

    await prisma.student.create({
      data: {
        id: stu3Id,
        userId: stuUsers[2].id,
        admissionNo: `ADM-3-AGE-${suffix}`,
        firstName: 'Charlie',
        lastName: 'LeapBorn',
        gender: 'M',
        dob: new Date('2012-02-29T00:00:00.000Z'),
        updatedAt: new Date(),
      },
    });

    // Enroll students in section
    await prisma.studentEnrollment.createMany({
      data: [
        { id: `enr-1-${suffix}`, studentId: stu1Id, classSectionId: testSectionId, academicYearId: testYearId, gradeLevelId: testGradeId, status: 'ACTIVE', enrollmentDate: new Date(), updatedAt: new Date() },
        { id: `enr-2-${suffix}`, studentId: stu2Id, classSectionId: testSectionId, academicYearId: testYearId, gradeLevelId: testGradeId, status: 'ACTIVE', enrollmentDate: new Date(), updatedAt: new Date() },
        { id: `enr-3-${suffix}`, studentId: stu3Id, classSectionId: testSectionId, academicYearId: testYearId, gradeLevelId: testGradeId, status: 'ACTIVE', enrollmentDate: new Date(), updatedAt: new Date() },
      ],
    });

    // Add marks for Student 1 (complete)
    for (const subId of [sub1Id, sub2Id]) {
      for (const term of ['TERM_1', 'TERM_2', 'TERM_3', 'TERM_4']) {
        await (prisma as any).subjectResult.create({
          data: {
            studentId: stu1Id,
            subjectId: subId,
            classSectionId: testSectionId,
            academicYearId: testYearId,
            term,
            marks: 85,
            status: 'SUBMITTED',
            updatedAt: new Date(),
          },
        });
      }
    }

    // Set conduct & approve roster
    await (prisma as any).classRosterReview.create({
      data: {
        id: `crr-age-${suffix}`,
        classSectionId: testSectionId,
        academicYearId: testYearId,
        homeroomTeacherId: hrTeacherId,
        status: 'APPROVED',
        submittedById: hrTeacherUserId,
        submittedAt: new Date(),
        reviewedById: adminUserId,
        reviewedAt: new Date(),
        conductData: {
          [stu1Id]: 'A',
          [stu2Id]: 'B',
          [stu3Id]: 'C',
        },
      },
    });

    // ─── Test G: calculateSectionRoster includes Age dynamically ───
    const calculatedRoster = await calculationService.calculateSectionRoster(testYearId, testSectionId);
    assert(calculatedRoster.students.length === 3, `Expected 3 students, got ${calculatedRoster.students.length}`);

    const alice = calculatedRoster.students.find((s) => s.studentId === stu1Id);
    const bob = calculatedRoster.students.find((s) => s.studentId === stu2Id);
    const charlie = calculatedRoster.students.find((s) => s.studentId === stu3Id);

    assert(alice !== undefined, 'Alice not found');
    assert(bob !== undefined, 'Bob not found');
    assert(charlie !== undefined, 'Charlie not found');

    // Expected age for Alice born 2010-09-05 with reference date 2026-09-06: 16
    const expectedAliceAge = calculationService.calculateAge(new Date('2010-09-05T00:00:00.000Z'));
    assert(alice!.age === expectedAliceAge, `Alice age expected ${expectedAliceAge}, got ${alice!.age}`);
    assert(typeof alice!.age === 'number', 'Alice age must be a number');

    // Bob has null DOB -> age must be null
    assert(bob!.age === null, `Bob age expected null, got ${bob!.age}`);

    // Charlie has leap year DOB
    const expectedCharlieAge = calculationService.calculateAge(new Date('2012-02-29T00:00:00.000Z'));
    assert(charlie!.age === expectedCharlieAge, `Charlie age expected ${expectedCharlieAge}, got ${charlie!.age}`);

    // Verify academic calculation integrity
    assert(alice!.isComplete === true, 'Alice must be COMPLETE');
    assert(alice!.sum === 170, `Alice sum expected 170, got ${alice!.sum}`);
    assert(alice!.average === 85, `Alice average expected 85, got ${alice!.average}`);
    assert(alice!.rank === 1, `Alice rank expected 1, got ${alice!.rank}`);
    assert(alice!.conduct === 'A', `Alice conduct expected 'A', got ${alice!.conduct}`);

    assert(bob!.isComplete === false, 'Bob must be INCOMPLETE');
    assert(bob!.sum === null, 'Bob sum must be null');
    assert(bob!.average === null, 'Bob average must be null');
    assert(bob!.rank === null, 'Bob rank must be null');
    assert(bob!.conduct === 'B', `Bob conduct expected 'B', got ${bob!.conduct}`);

    results.push({ name: 'Test G — calculateSectionRoster returns correct dynamic age and preserves academic metrics', passed: true });
    console.log('✓ Test G passed');

    // ─── Test H: generatePaperRosterRows includes Age and maintains 7 rows per student ───
    const paperRows = calculationService.generatePaperRosterRows(calculatedRoster.students);
    assert(paperRows.length === 3, `Expected 3 paper student groups, got ${paperRows.length}`);

    paperRows.forEach((pStudent) => {
      assert('age' in pStudent, `Paper student ${pStudent.studentName} must contain age property`);
      assert(pStudent.periods.length === 7, `Paper student ${pStudent.studentName} must have exactly 7 academic period rows`);
      const periodLabels = pStudent.periods.map((p) => p.period);
      assert(
        JSON.stringify(periodLabels) === JSON.stringify(['1st', '2nd', 'Ave1', '3rd', '4th', 'Ave2', 'Yearly']),
        `Incorrect period sequence: ${periodLabels.join(',')}`,
      );
    });

    const paperAlice = paperRows.find((p) => p.studentId === stu1Id);
    const paperBob = paperRows.find((p) => p.studentId === stu2Id);
    assert(paperAlice?.age === expectedAliceAge, `Paper Alice age expected ${expectedAliceAge}, got ${paperAlice?.age}`);
    assert(paperBob?.age === null, `Paper Bob age expected null, got ${paperBob?.age}`);

    results.push({ name: 'Test H — generatePaperRosterRows preserves age and exactly 7 academic rows per student', passed: true });
    console.log('✓ Test H passed');

    // ─── Test I: ReportsService official print and admin full roster include Age ───
    const adminRoster = await reportsService.getFullSectionRoster(testSectionId, testYearId);
    assert(adminRoster.students.length === 3, 'Admin roster must return 3 students');
    assert(adminRoster.students[0].age !== undefined, 'Admin roster student must have age');

    const officialPrint = await reportsService.getOfficialPrintRoster(testSectionId, testYearId, adminUserId, 'ADMIN');
    assert(officialPrint.students.length === 3, 'Official print must return 3 students');
    const printAlice = officialPrint.students.find((s: any) => s.studentId === stu1Id);
    assert(printAlice?.age === expectedAliceAge, `Official print Alice age expected ${expectedAliceAge}, got ${printAlice?.age}`);
    assert(officialPrint.paperRows.length === 3, 'Official print must return 3 paperRows');
    const printPaperAlice = officialPrint.paperRows.find((p: any) => p.studentId === stu1Id);
    assert(printPaperAlice?.age === expectedAliceAge, `Official print paperRow Alice age expected ${expectedAliceAge}, got ${printPaperAlice?.age}`);

    results.push({ name: 'Test I — ReportsService admin roster and official print include authoritative age', passed: true });
    console.log('✓ Test I passed');
  } catch (err: any) {
    results.push({ name: 'Database Roster Integration Tests', passed: false, error: err.message });
    console.error('✗ Database Roster Integration Tests failed:', err.message);
  } finally {
    // Clean up test data
    try {
      await (prisma as any).classRosterReview.deleteMany({ where: { classSectionId: testSectionId } });
      await (prisma as any).subjectResult.deleteMany({ where: { classSectionId: testSectionId } });
      await prisma.studentEnrollment.deleteMany({ where: { classSectionId: testSectionId } });
      await prisma.student.deleteMany({ where: { id: { in: [stu1Id, stu2Id, stu3Id] } } });
      await (prisma as any).sectionSubjectTeacher.deleteMany({ where: { classSectionId: testSectionId } });
      await prisma.subject.deleteMany({ where: { id: { in: [sub1Id, sub2Id] } } });
      await prisma.classSection.deleteMany({ where: { id: testSectionId } });
      await prisma.teacher.deleteMany({ where: { id: hrTeacherId } });
      await prisma.gradeLevel.deleteMany({ where: { id: testGradeId } });
      await prisma.academicYear.deleteMany({ where: { id: testYearId } });
      await prisma.user.deleteMany({
        where: { id: { in: [hrTeacherUserId, adminUserId, `u-s1-age-${suffix}`, `u-s2-age-${suffix}`, `u-s3-age-${suffix}`] } },
      });
    } catch (e: any) {
      // Ignore cleanup errors
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SUMMARY REPORT
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n====================================================');
  console.log('TEST SUMMARY RESULTS');
  console.log('====================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  results.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.passed ? 'PASS' : 'FAIL'}] ${r.name}${r.error ? ` — Error: ${r.error}` : ''}`);
  });

  console.log(`\nTOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error('Fatal error during test run:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
