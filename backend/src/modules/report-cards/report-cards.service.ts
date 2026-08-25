import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportCardsService {
  constructor(private prisma: PrismaService) {}



  async getTerms(academicYearId: string) {
    if (!academicYearId) {
      throw new BadRequestException('Academic Year is required');
    }
    return this.prisma.term.findMany({
      where: { academicYearId },
      orderBy: { startDate: 'asc' }
    });
  }

  async getStudents(classSectionId: string, search?: string) {
    if (!classSectionId) {
      throw new BadRequestException('Class Section is required');
    }
    
    const whereClause: any = {
      classSectionId,
      status: 'ACTIVE'
    };

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { admissionNo: { contains: search, mode: 'insensitive' } }
      ];
    }

    const students = await this.prisma.student.findMany({
      where: whereClause,
      include: {
        User: {
          select: { avatarUrl: true }
        }
      },
      orderBy: { firstName: 'asc' }
    });

    return students.map(student => ({
      id: student.id,
      admissionNo: student.admissionNo,
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      avatarUrl: student.User?.avatarUrl
    }));
  }

  async getReportCard(studentId: string, classSectionId: string, termId: string) {
    if (!studentId || !classSectionId || !termId) {
      throw new BadRequestException('Student ID, Class Section ID, and Term ID are required');
    }

    // 1. Fetch Student and related basic info
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        User: { select: { avatarUrl: true } },
        ClassSection: {
          include: {
            GradeLevel: true,
            AcademicYear: true
          }
        }
      }
    });

    if (!student) throw new NotFoundException('Student not found');
    
    const term = await this.prisma.term.findUnique({
      where: { id: termId }
    });
    if (!term) throw new NotFoundException('Term not found');

    // 2. Fetch Grades for this student via Examinations belonging to this term/section
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId,
        Examination: {
          termId,
          classSectionId
        }
      },
      include: {
        Examination: {
          include: {
            Subject: true
          }
        }
      }
    });

    // 3. Aggregate subject performance
    const subjectMap = new Map<string, any>();

    for (const grade of grades) {
      const exam = grade.Examination;
      if (!exam || !exam.Subject) continue;

      const subjectId = exam.Subject.id;
      const score = grade.score || 0;
      const maxScore = grade.maxScore || 0;
      const weight = exam.weightage || 1;

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subjectName: exam.Subject.name,
          subjectCode: exam.Subject.code,
          totalScore: 0,
          totalMaxScore: 0
        });
      }

      const current = subjectMap.get(subjectId);
      current.totalScore += (score * weight);
      current.totalMaxScore += (maxScore * weight);
    }

    const subjects = Array.from(subjectMap.values()).map(sub => {
      let percentage = 0;
      if (sub.totalMaxScore > 0) {
        percentage = (sub.totalScore / sub.totalMaxScore) * 100;
      }
      return {
        name: sub.subjectName,
        code: sub.subjectCode,
        score: Math.round(sub.totalScore * 100) / 100,
        maxScore: Math.round(sub.totalMaxScore * 100) / 100,
        percentage: Math.round(percentage * 10) / 10,
        gradeLetter: this.calculateGradeLetter(percentage)
      };
    });

    // Overall Calculation
    let overallTotalScore = 0;
    let overallTotalMaxScore = 0;
    for (const sub of subjects) {
      overallTotalScore += sub.score;
      overallTotalMaxScore += sub.maxScore;
    }
    
    let overallPercentage = 0;
    if (overallTotalMaxScore > 0) {
      overallPercentage = (overallTotalScore / overallTotalMaxScore) * 100;
    }
    overallPercentage = Math.round(overallPercentage * 10) / 10;

    // 4. Fetch Attendance
    const attendanceRecords = await this.prisma.studentAttendance.findMany({
      where: {
        studentId,
        classSectionId,
        date: {
          gte: term.startDate,
          lte: term.endDate
        }
      }
    });

    let present = 0;
    let absent = 0;
    
    for (const record of attendanceRecords) {
      if (['PRESENT', 'LATE', 'EXCUSED'].includes(record.status)) {
        present++;
      } else if (record.status === 'ABSENT') {
        absent++;
      }
    }
    const totalDays = present + absent;
    const attendancePercentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    return {
      student: {
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        avatarUrl: student.User?.avatarUrl
      },
      academicInfo: {
        academicYear: student.ClassSection?.AcademicYear?.year || '',
        grade: student.ClassSection?.GradeLevel?.name || '',
        section: student.ClassSection?.name || '',
        term: term.name
      },
      subjects,
      overall: {
        percentage: overallPercentage,
        gradeLetter: this.calculateGradeLetter(overallPercentage)
      },
      attendance: {
        present,
        absent,
        total: totalDays,
        percentage: attendancePercentage
      }
    };
  }

  private calculateGradeLetter(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'C+';
    if (percentage >= 65) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }
}
