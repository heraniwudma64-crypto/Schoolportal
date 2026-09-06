import { PrismaClient } from '@prisma/client';
import { CalculationService } from '../modules/results/calculation.service';
import { ReportsService } from '../modules/reports/reports.service';
import { PrismaService } from '../common/prisma/prisma.service';

const prisma = new PrismaClient();
const prismaService = prisma as unknown as PrismaService;
const calculationService = new CalculationService(prismaService);
const reportsService = new ReportsService(prismaService, calculationService);

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function verifyAgeConsistency() {
  console.log('====================================================');
  console.log('MULTI-VIEW AGE CONSISTENCY VERIFICATION');
  console.log('====================================================\n');

  const suffix = Date.now().toString().slice(-6);
  const testYearId = `yr-age-cons-${suffix}`;
  const testGradeId = `grd-age-cons-${suffix}`;
  const testSectionId = `sec-age-cons-${suffix}`;
  const hrTeacherUserId = `u-hr-cons-${suffix}`;
  const hrTeacherId = `t-hr-cons-${suffix}`;
  const adminUserId = `u-adm-cons-${suffix}`;

  const sub1Id = `sub-1-cons-${suffix}`;
  const sub2Id = `sub-2-cons-${suffix}`;

  const stu1Id = `stu-1-cons-${suffix}`; // 2010-09-05 -> 16
  const stu2Id = `stu-2-cons-${suffix}`; // null -> null ('—')
  const stu3Id = `stu-3-cons-${suffix}`; // 2012-02-29 -> 14

  try {
    // 1. Setup DB Fixtures
    await prisma.academicYear.create({
      data: {
        id: testYearId,
        year: `2025/2026-CONS-${suffix}`,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-06-30'),
        isCurrent: true,
        updatedAt: new Date(),
      },
    });

    await prisma.gradeLevel.create({
      data: { id: testGradeId, name: `Grade 11-Cons-${suffix}`, gradeNumber: 11, status: 'ACTIVE' },
    });

    await prisma.user.createMany({
      data: [
        { id: hrTeacherUserId, loginId: `hr_c_${suffix}`, name: 'HR Teacher', email: `hr-c-${suffix}@school.com`, password: 'hash', role: 'TEACHER' },
        { id: adminUserId, loginId: `adm_c_${suffix}`, name: 'Admin User', email: `adm-c-${suffix}@school.com`, password: 'hash', role: 'ADMIN' },
      ],
    });

    await prisma.teacher.create({
      data: { id: hrTeacherId, userId: hrTeacherUserId, firstName: 'HR', lastName: 'Teacher', updatedAt: new Date() },
    });

    await prisma.classSection.create({
      data: {
        id: testSectionId,
        name: `Section-Cons-${suffix}`,
        gradeLevelId: testGradeId,
        academicYearId: testYearId,
        teacherId: hrTeacherId,
        status: 'ACTIVE',
        capacity: 35,
        updatedAt: new Date(),
      },
    });

    await prisma.subject.createMany({
      data: [
        { id: sub1Id, name: `Math-C-${suffix}`, code: `MTH-C-${suffix}`, updatedAt: new Date() },
        { id: sub2Id, name: `Physics-C-${suffix}`, code: `PHY-C-${suffix}`, updatedAt: new Date() },
      ],
    });

    await (prisma as any).sectionSubjectTeacher.createMany({
      data: [
        { classSectionId: testSectionId, subjectId: sub1Id, teacherId: hrTeacherId, academicYearId: testYearId },
        { classSectionId: testSectionId, subjectId: sub2Id, teacherId: hrTeacherId, academicYearId: testYearId },
      ],
    });

    const stuUsers = [
      { id: `u-s1-c-${suffix}`, loginId: `s1_c_${suffix}`, email: `s1-c-${suffix}@test.com`, firstName: 'Alice', lastName: 'Abebe', dob: new Date('2010-09-05T00:00:00.000Z') },
      { id: `u-s2-c-${suffix}`, loginId: `s2_c_${suffix}`, email: `s2-c-${suffix}@test.com`, firstName: 'Bob', lastName: 'Bekele', dob: null },
      { id: `u-s3-c-${suffix}`, loginId: `s3_c_${suffix}`, email: `s3-c-${suffix}@test.com`, firstName: 'Charlie', lastName: 'Chala', dob: new Date('2012-02-29T00:00:00.000Z') },
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

    for (let i = 0; i < stuUsers.length; i++) {
      const u = stuUsers[i];
      const sId = [stu1Id, stu2Id, stu3Id][i];
      await prisma.student.create({
        data: {
          id: sId,
          userId: u.id,
          admissionNo: `ADM-CONS-${i + 1}-${suffix}`,
          firstName: u.firstName,
          lastName: u.lastName,
          gender: i === 0 ? 'F' : 'M',
          dob: u.dob,
          updatedAt: new Date(),
        },
      });

      await prisma.studentEnrollment.create({
        data: {
          id: `enr-c-${i + 1}-${suffix}`,
          studentId: sId,
          classSectionId: testSectionId,
          academicYearId: testYearId,
          gradeLevelId: testGradeId,
          status: 'ACTIVE',
          enrollmentDate: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Submit grades so review can be approved
    for (const sId of [stu1Id, stu2Id, stu3Id]) {
      for (const subId of [sub1Id, sub2Id]) {
        for (const term of ['TERM_1', 'TERM_2', 'TERM_3', 'TERM_4']) {
          await (prisma as any).subjectResult.create({
            data: {
              studentId: sId,
              subjectId: subId,
              classSectionId: testSectionId,
              academicYearId: testYearId,
              term,
              marks: 80,
              status: 'SUBMITTED',
              updatedAt: new Date(),
            },
          });
        }
      }
    }

    await (prisma as any).classRosterReview.create({
      data: {
        id: `crr-cons-${suffix}`,
        classSectionId: testSectionId,
        academicYearId: testYearId,
        homeroomTeacherId: hrTeacherId,
        status: 'APPROVED',
        submittedById: hrTeacherUserId,
        submittedAt: new Date(),
        reviewedById: adminUserId,
        reviewedAt: new Date(),
        conductData: { [stu1Id]: 'A', [stu2Id]: 'B', [stu3Id]: 'A' },
      },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. RETRIEVE ROSTER FROM ALL 4 PATHWAYS
    // ─────────────────────────────────────────────────────────────────────────

    // Pathway 1: Homeroom Roster (backend CalculationService)
    const homeroomRoster = await calculationService.calculateSectionRoster(testYearId, testSectionId);

    // Pathway 2: Admin Full Roster
    const adminRoster = await reportsService.getFullSectionRoster(testSectionId, testYearId);

    // Pathway 3: Official Print Roster
    const officialPrintRoster = await reportsService.getOfficialPrintRoster(testSectionId, testYearId, adminUserId, 'ADMIN');

    // Pathway 4: CSV Export Logic (simulating HomeroomRosterRedesigned.tsx handleExportCsv)
    const csvExportRows: { admissionNo: string; studentName: string; ageDisplay: string }[] = [];
    const headers = ['No', 'Admission No', 'Student Name', 'Age', 'Sex', 'Academic Period', 'Conduct', 'Rank'];
    
    homeroomRoster.students.forEach((student, idx) => {
      // Exactly mirrors HomeroomRosterRedesigned.tsx handleExportCsv line 222
      const ageDisplay = student.age != null ? String(student.age) : '—';
      csvExportRows.push({
        admissionNo: student.admissionNo,
        studentName: student.studentName,
        ageDisplay,
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. VERIFY IDENTICAL AGE VALUES ACROSS ALL 4 PATHWAYS
    // ─────────────────────────────────────────────────────────────────────────

    console.log('Comparing ages across views for each student:\n');
    console.log(
      'Student Name'.padEnd(16) +
      '| DOB'.padEnd(14) +
      '| 1. Homeroom'.padEnd(14) +
      '| 2. Admin Roster'.padEnd(18) +
      '| 3. Official Print'.padEnd(20) +
      '| 4. CSV Export'.padEnd(15) +
      '| Status'
    );
    console.log('-'.repeat(105));

    const testStudents = [
      { id: stu1Id, name: 'Alice Abebe', dobStr: '2010-09-05', expectedAge: 16 },
      { id: stu2Id, name: 'Bob Bekele', dobStr: 'None (null)', expectedAge: null },
      { id: stu3Id, name: 'Charlie Chala', dobStr: '2012-02-29', expectedAge: 14 },
    ];

    for (const expected of testStudents) {
      // 1. Homeroom Roster
      const hrStudent = homeroomRoster.students.find((s) => s.studentId === expected.id);
      assert(hrStudent !== undefined, `Homeroom student not found: ${expected.name}`);
      const hrAge = hrStudent!.age;

      // 2. Admin Full Roster
      const adminStudent = adminRoster.students.find((s: any) => s.studentId === expected.id);
      assert(adminStudent !== undefined, `Admin roster student not found: ${expected.name}`);
      const adminAge = adminStudent!.age;

      // 3. Official Print Roster (students and paperRows)
      const printStudent = officialPrintRoster.students.find((s: any) => s.studentId === expected.id);
      assert(printStudent !== undefined, `Official print student not found: ${expected.name}`);
      const printAge = printStudent!.age;

      const paperStudent = officialPrintRoster.paperRows.find((p: any) => p.studentId === expected.id);
      assert(paperStudent !== undefined, `Official print paper student not found: ${expected.name}`);
      const paperAge = paperStudent!.age;

      // 4. CSV Export
      const csvRow = csvExportRows.find((c) => c.admissionNo === hrStudent!.admissionNo);
      assert(csvRow !== undefined, `CSV row not found for: ${expected.name}`);
      const csvAgeDisplay = csvRow!.ageDisplay;

      // Assertions
      assert(hrAge === expected.expectedAge, `Homeroom age mismatch for ${expected.name}: expected ${expected.expectedAge}, got ${hrAge}`);
      assert(adminAge === hrAge, `Admin age mismatch for ${expected.name}: expected ${hrAge}, got ${adminAge}`);
      assert(printAge === hrAge, `Official print age mismatch for ${expected.name}: expected ${hrAge}, got ${printAge}`);
      assert(paperAge === hrAge, `Official paperRows age mismatch for ${expected.name}: expected ${hrAge}, got ${paperAge}`);

      const expectedCsvDisplay = expected.expectedAge != null ? String(expected.expectedAge) : '—';
      assert(csvAgeDisplay === expectedCsvDisplay, `CSV display mismatch for ${expected.name}: expected ${expectedCsvDisplay}, got ${csvAgeDisplay}`);

      const hrDisplay = hrAge != null ? String(hrAge) : '—';
      const adminDisplay = adminAge != null ? String(adminAge) : '—';
      const printDisplay = printAge != null ? String(printAge) : '—';

      console.log(
        expected.name.padEnd(16) +
        `| ${expected.dobStr}`.padEnd(14) +
        `| ${hrDisplay}`.padEnd(14) +
        `| ${adminDisplay}`.padEnd(18) +
        `| ${printDisplay}`.padEnd(20) +
        `| ${csvAgeDisplay}`.padEnd(15) +
        '| IDENTICAL ✓'
      );
    }

    console.log('\n====================================================');
    console.log('VERIFICATION RESULT: 100% IDENTICAL ACROSS ALL 4 VIEWS');
    console.log('====================================================\n');

  } finally {
    // Cleanup
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
        where: { id: { in: [hrTeacherUserId, adminUserId, `u-s1-c-${suffix}`, `u-s2-c-${suffix}`, `u-s3-c-${suffix}`] } },
      });
    } catch (e: any) {
      // Ignore cleanup error
    }
  }
}

verifyAgeConsistency()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Fatal error during consistency verification:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
