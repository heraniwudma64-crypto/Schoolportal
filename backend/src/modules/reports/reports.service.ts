import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateClassRoster(classSectionId: string, academicYearId: string, term: string) {
    const students = await this.prisma.student.findMany({
      where: { classSectionId },
      select: { id: true, firstName: true, lastName: true },
    });

    const results = await (this.prisma as any).subjectResult.findMany({
      where: { classSectionId, academicYearId, term, status: 'SUBMITTED' },
      include: { Subject: true },
    });

    // 1. Group student marks by subject
    const studentScoresMap = new Map<string, { student: any; subjects: Record<string, number>; totalMarks: number }>();

    students.forEach((student: any) => {
      studentScoresMap.set(student.id, { student, subjects: {}, totalMarks: 0 });
    });

    results.forEach((res: any) => {
      const entry = studentScoresMap.get(res.studentId);
      if (entry) {
        entry.subjects[res.Subject.name] = res.marks;
        entry.totalMarks += res.marks;
      }
    });

    // 2. Sort students by total marks descending to assign ranks
    const rosterList = Array.from(studentScoresMap.values()).sort((a, b) => b.totalMarks - a.totalMarks);

    // 3. Compute position/rank
    const totalSubjects = new Set(results.map((r: any) => r.subjectId)).size || 1;

    return rosterList.map((item, index) => ({
      rank: index + 1,
      studentId: item.student.id,
      studentName: `${item.student.firstName} ${item.student.lastName}`,
      rollNumber: (item.student as any).rollNumber || item.student.id,
      subjectScores: item.subjects,
      totalMarks: item.totalMarks,
      average: Number((item.totalMarks / totalSubjects).toFixed(2)),
    }));
  }
}