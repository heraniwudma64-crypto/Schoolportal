import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// ─── Shared grade-letter helper ───────────────────────────────────────────────
function gradeLetter(pct: number): string {
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Existing homeroom roster ─────────────────────────────────────────────

  async generateClassRoster(classSectionId: string, academicYearId: string, term: string) {
    const students = await this.prisma.student.findMany({
      where: { classSectionId },
      select: { id: true, firstName: true, lastName: true },
    });

    const results = await (this.prisma as any).subjectResult.findMany({
      where: { classSectionId, academicYearId, term, status: 'SUBMITTED' },
      include: { Subject: true },
    });

    const studentScoresMap = new Map<
      string,
      { student: any; subjects: Record<string, number>; totalMarks: number }
    >();

    students.forEach((s: any) => {
      studentScoresMap.set(s.id, { student: s, subjects: {}, totalMarks: 0 });
    });

    results.forEach((res: any) => {
      const entry = studentScoresMap.get(res.studentId);
      if (entry) {
        entry.subjects[res.Subject.name] = res.marks;
        entry.totalMarks += res.marks;
      }
    });

    const rosterList = Array.from(studentScoresMap.values()).sort(
      (a, b) => b.totalMarks - a.totalMarks,
    );
    const totalSubjects = new Set(results.map((r: any) => r.subjectId)).size || 1;

    return rosterList.map((item, index) => ({
      rank: index + 1,
      studentId: item.student.id,
      studentName: `${item.student.firstName} ${item.student.lastName}`,
      subjectScores: item.subjects,
      totalMarks: item.totalMarks,
      average: Number((item.totalMarks / totalSubjects).toFixed(2)),
    }));
  }

  // ── NEW: admin sections summary ──────────────────────────────────────────

  /**
   * List all class sections for an academic year with:
   * - homeroom teacher name
   * - enrolled student count
   * - total assigned subjects and how many are fully submitted
   * - overall submission status: 'complete' | 'partial' | 'none'
   */
  async getAdminSectionsSummary(academicYearId?: string) {
    // Resolve academic year
    let yearId = academicYearId;
    if (!yearId) {
      const current = await this.prisma.academicYear.findFirst({
        where: { isCurrent: true },
        select: { id: true },
      });
      yearId = current?.id;
    }
    if (!yearId) return [];

    const sections = await this.prisma.classSection.findMany({
      where: { academicYearId: yearId, gradeLevelId: { not: null } },
      include: {
        GradeLevel: { select: { name: true, gradeNumber: true } },
        Teacher: { select: { firstName: true, lastName: true } },
        _count: {
          select: {
            StudentEnrollment: true,
          },
        },
      },
      orderBy: [
        { GradeLevel: { gradeNumber: 'asc' } },
        { name: 'asc' },
      ],
    });

    // For each section, count assigned subjects and fully-submitted subjects
    const results = await Promise.all(
      sections.map(async (section) => {
        const enrolledCount = await this.prisma.studentEnrollment.count({
          where: { classSectionId: section.id, academicYearId: yearId!, status: 'ACTIVE' },
        });

        const assignedSubjects = await (this.prisma as any).sectionSubjectTeacher.findMany({
          where: { classSectionId: section.id, academicYearId: yearId },
          select: { subjectId: true, teacherId: true, Teacher: { select: { firstName: true, lastName: true } } },
        });
        const totalSubjects = assignedSubjects.length;

        // A subject is "fully submitted" when every enrolled student has a
        // SUBMITTED row for at least one term in this section.
        let submittedSubjects = 0;
        if (enrolledCount > 0 && totalSubjects > 0) {
          for (const assignment of assignedSubjects) {
            const submittedCount = await (this.prisma as any).subjectResult.count({
              where: {
                classSectionId: section.id,
                subjectId: assignment.subjectId,
                academicYearId: yearId,
                status: 'SUBMITTED',
              },
            });
            // At least one term's results submitted for all students
            if (submittedCount >= enrolledCount) submittedSubjects++;
          }
        }

        const submissionStatus =
          totalSubjects === 0
            ? 'none'
            : submittedSubjects === totalSubjects
            ? 'complete'
            : submittedSubjects > 0
            ? 'partial'
            : 'none';

        const homeroomTeacher = section.Teacher
          ? `${section.Teacher.firstName} ${section.Teacher.lastName}`.trim()
          : null;

        const gradeName = section.GradeLevel?.name ?? '';
        const displayName = /^grade\b/i.test(gradeName)
          ? `${gradeName} ${section.name}`
          : `Grade ${gradeName} ${section.name}`.trim();

        return {
          id: section.id,
          name: section.name,
          displayName,
          gradeLevelName: gradeName,
          academicYearId: yearId,
          homeroomTeacher,
          enrolledCount,
          totalSubjects,
          submittedSubjects,
          submissionStatus,   // 'complete' | 'partial' | 'none'
          status:
            submissionStatus === 'complete'
              ? 'Submitted'
              : submissionStatus === 'partial'
              ? 'Pending Review'
              : 'Draft',
        };
      }),
    );

    return results;
  }

  // ── NEW: compiled report cards for admin ────────────────────────────────

  /**
   * Mirrors ReportCardsService.getCompiledReportCards but is accessible to
   * ADMIN without requiring homeroom-teacher ownership validation.
   */
  async getCompiledReportCards(classSectionId: string, academicYearId: string) {
    const section = await this.prisma.classSection.findUnique({
      where: { id: classSectionId },
      include: { GradeLevel: true, Teacher: true, AcademicYear: true },
    });
    if (!section) throw new NotFoundException('Class section not found');

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { classSectionId, academicYearId, status: 'ACTIVE' },
      include: {
        Student: {
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            lastName: true,
            gender: true,
            dob: true,
          },
        },
      },
      orderBy: { Student: { lastName: 'asc' } },
    });

    const subjectResults = await (this.prisma as any).subjectResult.findMany({
      where: { classSectionId, academicYearId, status: 'SUBMITTED' },
      include: { Subject: { select: { id: true, name: true, code: true } } },
    });

    // Build subject list in canonical order
    const subjectOrder = [
      'Afaan Oromoo','Amharic','English','Maths','Math','Biology',
      'Chemistry','Physics','Citizenship','History','Geography',
      'Economics','ICT','HPE',
    ];
    const subjectMap = new Map<string, { id: string; name: string; code: string }>();
    subjectResults.forEach((r: any) => subjectMap.set(r.subjectId, r.Subject));
    const subjects = Array.from(subjectMap.values()).sort((a, b) => {
      const ai = subjectOrder.findIndex((n) => n.toLowerCase() === a.name.toLowerCase());
      const bi = subjectOrder.findIndex((n) => n.toLowerCase() === b.name.toLowerCase());
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.name.localeCompare(b.name);
    });

    const termKeys = ['TERM_1', 'TERM_2', 'TERM_3', 'TERM_4'];
    const avg = (vals: Array<number | null>) => {
      const present = vals.filter((v): v is number => v !== null);
      return present.length
        ? Math.round((present.reduce((s, v) => s + v, 0) / present.length) * 10) / 10
        : null;
    };

    const absentCounts = (
      await this.prisma.studentAttendance.findMany({
        where: { classSectionId, status: 'ABSENT' },
        select: { studentId: true },
      })
    ).reduce((m, r) => { m.set(r.studentId, (m.get(r.studentId) || 0) + 1); return m; }, new Map<string, number>());

    const compiled = enrollments.map((enrollment: any) => {
      const student = enrollment.Student;
      const studentResults = subjectResults.filter((r: any) => r.studentId === student.id);

      const subjectScores = subjects.map((subj) => {
        const scores = termKeys.map(
          (t) => studentResults.find((r: any) => r.subjectId === subj.id && r.term === t)?.marks ?? null,
        );
        return {
          subjectId: subj.id,
          subjectName: subj.name,
          subjectCode: subj.code,
          term1: scores[0], term2: scores[1], term3: scores[2], term4: scores[3],
          sem1Avg: avg([scores[0], scores[1]]),
          sem2Avg: avg([scores[2], scores[3]]),
          yearlyAvg: avg(scores),
        };
      });

      const scored = subjectScores.filter((s) => s.yearlyAvg !== null);
      const overallTotal = Math.round(scored.reduce((sum, s) => sum + (s.yearlyAvg || 0), 0) * 10) / 10;
      const overallAverage = scored.length ? Math.round((overallTotal / scored.length) * 10) / 10 : 0;

      return {
        studentId: student.id,
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender ?? 'N/A',
        age: student.dob
          ? Math.floor((Date.now() - new Date(student.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 0,
        academicYear: section.AcademicYear?.year ?? academicYearId,
        gradeLevel: section.GradeLevel?.name ?? '',
        classSectionName: section.name,
        homeroomTeacher: section.Teacher
          ? `${section.Teacher.firstName} ${section.Teacher.lastName}`
          : 'Unassigned',
        subjectResults: subjectScores,
        overallTotal,
        overallAverage,
        overallRank: 0,          // filled below after sorting
        absentDays: absentCounts.get(student.id) || 0,
        conduct: 'A',
      };
    });

    compiled.sort((a, b) => b.overallAverage - a.overallAverage);
    compiled.forEach((c, i) => { c.overallRank = c.overallAverage > 0 ? i + 1 : 0; });
    return compiled;
  }
}
