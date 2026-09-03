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

 async generateClassRoster(classSectionId: string) {
  const section = await this.prisma.classSection.findUnique({
    where: { id: classSectionId },
    include: {
      GradeLevel: true,
      Teacher: true,
      students: {
        select: {
          id: true,
          admissionNo: true,
          firstName: true,
          lastName: true,
          gender: true,
          dob: true,
          status: true,
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' },
        ],
      },
    },
  });

  if (!section) {
    throw new NotFoundException('Class section not found');
  }

  return {
    sectionId: section.id,
    sectionName: section.name,
    gradeLevel: section.GradeLevel?.name,
    homeroomTeacher: section.Teacher
      ? `${section.Teacher.firstName} ${section.Teacher.lastName}`
      : 'Unassigned',
    studentCount: section.students.length,
    students: section.students,
  };
}  async getReportCard(studentId: string, classSectionId: string, termId: string) {

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

  async getCompiledReportCards(classSectionId: string, academicYearId: string) {
    // Fetch students, section, terms, results, and attendance concurrently
    const [students, section, terms, subjectResults, attendance] = await Promise.all([
      this.prisma.student.findMany({
        where: {
          ClassSection: { id: classSectionId },
          StudentEnrollment: {
            some: {
              classSectionId,
              academicYearId,
              status: 'ACTIVE'
            }
          }
        },
        select: {
          id: true,
          admissionNo: true,
          firstName: true,
          lastName: true,
          dob: true,
          gender: true,
        },
        orderBy: { lastName: 'asc' },
      }),
      this.prisma.classSection.findUnique({
        where: { id: classSectionId },
        select: {
          id: true,
          name: true,
          GradeLevel: { select: { name: true } },
          Teacher: { select: { firstName: true, lastName: true } },
          AcademicYear: { select: { year: true } },
        },
      }),
      this.prisma.term.findMany({
        where: { academicYearId },
        select: { id: true, name: true },
        orderBy: { startDate: 'asc' },
      }),
      (this.prisma as any).subjectResult.findMany({
        where: {
          classSectionId,
          academicYearId,
          status: 'SUBMITTED',
        },
        select: {
          studentId: true,
          subjectId: true,
          marks: true,
          term: true,
          Subject: { select: { name: true } },
        },
      }),
      this.prisma.studentAttendance.findMany({
        where: { classSectionId, status: 'ABSENT' },
        select: { studentId: true },
      }),
    ]);

    if (!section) throw new NotFoundException('Class section not found');

    const reportSubjectOrder = [
      'Afaan Oromoo', 'Amharic', 'English', 'Maths', 'Math', 'Biology',
      'Chemistry', 'Physics', 'Citizenship', 'History', 'Geography',
      'Economics', 'ICT', 'HPE',
    ];
    const resultSubjects = new Map<string, { id: string; name: string }>();
    subjectResults.forEach((result: any) => resultSubjects.set(result.subjectId, { id: result.subjectId, name: result.Subject.name }));
    const subjects = Array.from(resultSubjects.values()).sort((left, right) => {
      const leftIndex = reportSubjectOrder.findIndex((name) => name.toLowerCase() === left.name.toLowerCase());
      const rightIndex = reportSubjectOrder.findIndex((name) => name.toLowerCase() === right.name.toLowerCase());
      return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex) || left.name.localeCompare(right.name);
    });
    // The official card always presents these rows, even before a teacher has
    // submitted marks for one of them.
    for (const subjectName of reportSubjectOrder) {
      if (!subjects.some((subject) => subject.name.toLowerCase() === subjectName.toLowerCase())) {
        subjects.push({ id: `placeholder:${subjectName}`, name: subjectName });
      }
    }

    const absentDaysByStudent = attendance.reduce((counts, record) => {
      counts.set(record.studentId, (counts.get(record.studentId) || 0) + 1);
      return counts;
    }, new Map<string, number>());

    // Build compiled data for each student
    const compiledCards = students.map((student) => {
      // Get this student's subject results
      const studentResults = subjectResults.filter((r: any) => r.studentId === student.id);

      // Group results by subject and term
      const subjectMap = new Map<string, any>(subjects.map((subject) => [subject.id, {
        subjectName: subject.name, term1: null, term2: null, sem1Avg: null,
        term3: null, term4: null, sem2Avg: null, yearlyAvg: null,
      }]));
      studentResults.forEach((result: any) => {
        const key = result.subjectId;
        const sub = subjectMap.get(key);
        if (!sub) return;
        if (result.term === 'TERM_1') sub.term1 = result.marks;
        if (result.term === 'TERM_2') sub.term2 = result.marks;
        if (result.term === 'TERM_3') sub.term3 = result.marks;
        if (result.term === 'TERM_4') sub.term4 = result.marks;
      });

      const calculateAverage = (values: Array<number | null>) => {
        const present = values.filter((value): value is number => value !== null);
        return present.length ? Math.round((present.reduce((sum, value) => sum + value, 0) / present.length) * 10) / 10 : null;
      };
      const subjectResults_ = Array.from(subjectMap.values()).map((subject) => ({
        ...subject,
        sem1Avg: calculateAverage([subject.term1, subject.term2]),
        sem2Avg: calculateAverage([subject.term3, subject.term4]),
        yearlyAvg: calculateAverage([subject.term1, subject.term2, subject.term3, subject.term4]),
      }));

      // Calculate overall average and rank placeholder
      const scoredSubjects = subjectResults_.filter((subject) => subject.yearlyAvg !== null);
      const overallTotal = scoredSubjects.reduce((sum, s) => sum + (s.yearlyAvg || 0), 0);
      const overallAverage = scoredSubjects.length > 0
        ? Math.round((overallTotal / scoredSubjects.length) * 10) / 10
        : 0;

      return {
        studentId: student.id,
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        age: student.dob
          ? Math.floor((new Date().getTime() - new Date(student.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 0,
        gender: student.gender || 'N/A',
        academicYear: section.AcademicYear?.year || '',
        gradeLevel: section.GradeLevel?.name || '',
        classSectionName: section.name,
        promotedToGrade: '', // To be set by homeroom teacher
        homeroomTeacher: section.Teacher
          ? `${section.Teacher.firstName} ${section.Teacher.lastName}`
          : 'Unassigned',
        subjectResults: subjectResults_,
        overallTotal,
        overallAverage,
        overallRank: 0, // To be calculated later
        absentDays: absentDaysByStudent.get(student.id) || 0,
        conduct: 'A', // To be set by homeroom teacher
        behaviourAssessment: {
          academicPotential: 'A',
          uniform: 'A',
          timeManagement: 'A',
          harmfulActions: 'A',
          responsibilities: 'A',
          clubActivities: 'A',
          classworkHomework: 'A',
          flexibility: 'A',
          hardWork: 'A',
          positiveThinking: 'A',
          obeyingRules: 'A',
          interpersonalCommunication: 'A',
        },
        homeroomRemarksSem1: '',
        homeroomRemarksSem2: '',
      };
    });

    const rankedCards = [...compiledCards].sort((left, right) => right.overallAverage - left.overallAverage);
    rankedCards.forEach((card, index) => { card.overallRank = card.overallAverage > 0 ? index + 1 : 0; });
    return compiledCards;
  }
}
