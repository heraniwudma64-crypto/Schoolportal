import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class RosterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the value used by class selectors. Selectors normally send a
   * section ID, but accepting the display value keeps old clients compatible
   * with labels such as "Grade 10 A" while still resolving one exact section.
   */
  private async resolveClassSection(academicYearId: string, identifier: string) {
    const value = identifier.trim();
    const normalized = value.replace(/\s+/g, ' ').toLowerCase();

    const directMatch = await this.prisma.classSection.findFirst({
      where: {
        AND: [
          {
            OR: [
              { id: value },
              { name: { equals: value, mode: 'insensitive' } },
            ],
          },
          {
            academicYearId,
          },
        ],
      },
      include: { GradeLevel: { select: { id: true, name: true } } },
    });

    if (directMatch) return directMatch;

    const sections = await this.prisma.classSection.findMany({
      where: { academicYearId },
      include: { GradeLevel: { select: { id: true, name: true } } },
    });

    return sections.find((section) => {
      const grade = section.GradeLevel?.name?.trim() ?? '';
      const gradeLabel = /^grade\b/i.test(grade) ? grade : `Grade ${grade}`;
      const displayName = `${gradeLabel} ${section.name.trim()}`
        .replace(/\s+/g, ' ')
        .toLowerCase();
      return displayName === normalized;
    }) ?? null;
  }

  /** Active enrollment is the source of truth for grade-entry students. */
  async getEnrolledStudents(academicYearId: string, classSectionIdentifier: string) {
    if (!academicYearId || !classSectionIdentifier) {
      throw new BadRequestException('Academic Year and Class Section are required');
    }

    const section = await this.resolveClassSection(academicYearId, classSectionIdentifier);
    if (!section) {
      throw new NotFoundException('Class Section not found');
    }
    if (section.academicYearId !== academicYearId) {
      throw new BadRequestException('Class Section does not belong to the selected Academic Year');
    }
    if (!section.gradeLevelId || !section.GradeLevel) {
      throw new BadRequestException('Class Section has no associated grade level');
    }
    const gradeName = section.GradeLevel.name;

    // One-way, safe legacy repair: a student whose old profile points at a
    // fully canonical section receives the missing enrollment for this year.
    // Ambiguous legacy sections (no year/grade) are never guessed or moved.
    const legacyStudents = await this.prisma.student.findMany({
      where: {
        classSectionId: section.id,
        StudentEnrollment: { none: { academicYearId } },
      },
      select: { id: true },
    });
    if (legacyStudents.length) {
      await this.prisma.studentEnrollment.createMany({
        data: legacyStudents.map((student) => ({
          studentId: student.id,
          academicYearId,
          gradeLevelId: section.gradeLevelId!,
          classSectionId: section.id,
          status: 'ACTIVE',
        })),
        skipDuplicates: true,
      });
    }

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        academicYearId,
        gradeLevelId: section.gradeLevelId,
        classSectionId: section.id,
        status: 'ACTIVE',
      },
      select: {
        Student: {
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            lastName: true,
            User: { select: { loginId: true } },
          },
        },
      },
      orderBy: [{ Student: { lastName: 'asc' } }, { Student: { firstName: 'asc' } }],
    });

    return enrollments.map(({ Student }) => ({
      id: Student.id,
      admissionNo: Student.admissionNo,
      loginId: Student.User?.loginId ?? null,
      firstName: Student.firstName,
      lastName: Student.lastName,
      name: `${Student.firstName} ${Student.lastName}`.trim(),
      classSection: {
        id: section.id,
        name: section.name,
        grade: gradeName,
        displayName: `${/^grade\b/i.test(gradeName) ? gradeName : `Grade ${gradeName}`} ${section.name}`,
      },
    }));
  }

  async getConsolidatedRoster(academicYearId: string, classSectionId: string) {
    if (!academicYearId || !classSectionId) throw new BadRequestException('Academic Year and Class Section are required');

    const [section, enrollments, results, assignments, absences] = await Promise.all([
      this.prisma.classSection.findUnique({
        where: { id: classSectionId },
        select: {
          id: true,
          name: true,
          GradeLevel: { select: { name: true } },
          homeroomTeacher: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.studentEnrollment.findMany({
        where: { academicYearId, classSectionId, status: 'ACTIVE' },
        select: {
          Student: { select: { id: true, admissionNo: true, firstName: true, lastName: true, gender: true } },
        },
        orderBy: { Student: { lastName: 'asc' } },
      }),
      (this.prisma as any).subjectResult.findMany({
        where: { academicYearId, classSectionId, status: 'SUBMITTED' },
        select: {
          studentId: true,
          term: true,
          marks: true,
          Subject: { select: { id: true, name: true, code: true } },
        },
      }),
      (this.prisma as any).sectionSubjectTeacher.findMany({
        where: { academicYearId, classSectionId },
        select: {
          Subject: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.studentAttendance.findMany({
        where: { classSectionId, status: 'ABSENT' },
        select: { studentId: true },
      }),
    ]);
    if (!section) throw new NotFoundException('Class Section not found');

    const termKeys = ['TERM_1', 'TERM_2', 'TERM_3', 'TERM_4'];
    const normalizeTerm = (term: string) => {
      const match = term.match(/[1-4]/);
      return match ? `TERM_${match[0]}` : term.toUpperCase();
    };
    const subjectOrder = ['Amharic', 'English', 'Math', 'Economics', 'Geography', 'ICT', 'History'];
    const subjects = [...new Map([
      ...assignments.map((assignment: any) => [assignment.Subject.id, assignment.Subject]),
      ...results.map((result: any) => [result.Subject.id, result.Subject]),
    ]).values()]
      .sort((left: any, right: any) => {
        const leftIndex = subjectOrder.findIndex((name) => left.name.toLowerCase() === name.toLowerCase());
        const rightIndex = subjectOrder.findIndex((name) => right.name.toLowerCase() === name.toLowerCase());
        return (leftIndex < 0 ? 100 : leftIndex) - (rightIndex < 0 ? 100 : rightIndex) || left.name.localeCompare(right.name);
      });

    const absentDaysByStudent = absences.reduce((counts, absence) => {
      counts.set(absence.studentId, (counts.get(absence.studentId) || 0) + 1);
      return counts;
    }, new Map<string, number>());
    const rows = enrollments.map((enrollment: any) => {
      const studentResults = results.filter((result: any) => result.studentId === enrollment.Student.id);
      const subjectScores = subjects.map((subject: any) => {
        const scores = termKeys.map((term) => studentResults.find((result: any) => result.Subject.id === subject.id && normalizeTerm(result.term) === term)?.marks ?? null);
        const available = scores.filter((score): score is number => score !== null);
        const semesterA = scores.slice(0, 2).filter((score): score is number => score !== null);
        const semesterB = scores.slice(2).filter((score): score is number => score !== null);
        const average = (values: number[]) => values.length ? Number((values.reduce((sum, score) => sum + score, 0) / values.length).toFixed(2)) : null;
        return {
          subjectId: subject.id,
          subject: subject.name,
          code: subject.code,
          term1: scores[0], term2: scores[1], term3: scores[2], term4: scores[3],
          sem1Avg: average(semesterA), sem2Avg: average(semesterB), yearlyAverage: average(available),
          // Preserved for the existing compact roster view.
          terms: scores, semesterAverages: [average(semesterA), average(semesterB)],
        };
      });
      const yearlyAverages = subjectScores.map((score) => score.yearlyAverage).filter((score): score is number => score !== null);
      const sum = Number(yearlyAverages.reduce((total, score) => total + score, 0).toFixed(2));
      return { studentId: enrollment.Student.id, admissionNo: enrollment.Student.admissionNo, studentName: `${enrollment.Student.firstName} ${enrollment.Student.lastName}`, sex: enrollment.Student.gender ?? '', subjectScores, sum, average: yearlyAverages.length ? Number((sum / yearlyAverages.length).toFixed(2)) : null, rank: 0, absentDays: absentDaysByStudent.get(enrollment.Student.id) || 0, conduct: null };
    });
    rows.sort((left, right) => (right.average ?? -1) - (left.average ?? -1));
    rows.forEach((row, index) => { row.rank = row.average === null ? 0 : index + 1; });
    return { section: { id: section.id, name: section.name, grade: section.GradeLevel?.name, homeroomTeacher: section.homeroomTeacher ? `${section.homeroomTeacher.firstName} ${section.homeroomTeacher.lastName}` : null }, terms: termKeys, subjects: subjects.map((subject: any) => ({ id: subject.id, name: subject.name, code: subject.code })), students: rows };
  }

  async getRoster(academicYearId: string, classSectionId: string) {
    if (!academicYearId || !classSectionId) {
      throw new BadRequestException('Academic Year and Class Section are required');
    }

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        academicYearId,
        classSectionId,
      },
      include: {
        Student: {
          include: {
            User: {
              select: { avatarUrl: true }
            },
            StudentAttendance: {
              where: {
                classSectionId
              }
            },
            ExamAttempt: {
              include: {
                Examination: {
                  select: { 
                    classSectionId: true,
                    totalMarks: true,
                    passingMarks: true,
                    examDate: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        Student: {
          firstName: 'asc'
        }
      }
    });

    return enrollments.map(enrollment => {
      const student = enrollment.Student;
      
      // Calculate attendance
      const sectionAttendance = student.StudentAttendance || [];
      const totalDays = sectionAttendance.length;
      const presentDays = sectionAttendance.filter((a:any) => a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'EXCUSED').length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : null;

      // Calculate exam status
      const sectionExams = student.ExamAttempt?.filter(a => a.Examination?.classSectionId === classSectionId) || [];
      let examStatus = 'Not Taken';
      
      if (sectionExams.length > 0) {
        // Sort to prefer the most recent exam
        sectionExams.sort((a, b) => new Date(b.Examination.examDate).getTime() - new Date(a.Examination.examDate).getTime());
        const recentAttempt = sectionExams[0];
        
        if (recentAttempt.Examination.passingMarks != null) {
    if (recentAttempt.marksObtained >= recentAttempt.Examination.passingMarks) {
            examStatus = 'Passed';
          } else {
            examStatus = 'Failed';
          }
        } else {
          examStatus = 'Completed';
        }
      }

      return {
        id: enrollment.id,
        enrollmentDate: enrollment.enrollmentDate,
        status: enrollment.status,
        student: {
          id: student.id,
          admissionNo: student.admissionNo,
          firstName: student.firstName,
          lastName: student.lastName,
          gender: student.gender,
          avatarUrl: student.User?.avatarUrl
        },
        attendancePercentage,
        examStatus,
      };
    });
  }

  async getSummary(academicYearId: string, classSectionId: string) {
    if (!academicYearId || !classSectionId) {
      throw new BadRequestException('Academic Year and Class Section are required');
    }

    const section = await this.prisma.classSection.findUnique({
      where: { id: classSectionId },
      include: { GradeLevel: true }
    });

    if (!section) {
      throw new NotFoundException('Class Section not found');
    }

    const totalEnrolled = await this.prisma.studentEnrollment.count({
      where: { classSectionId, academicYearId }
    });

    return {
      name: section.name,
      roomNumber: section.roomNumber,
      capacity: section.capacity,
      gradeName: section.GradeLevel?.name,
      totalEnrolled
    };
  }

  async enrollStudent(data: { studentId: string; academicYearId: string; gradeLevelId: string; classSectionId: string; enrollmentDate: string; status: string }) {
    const section = await this.prisma.classSection.findUnique({
      where: { id: data.classSectionId }
    });

    if (!section) {
      throw new NotFoundException('Class Section not found');
    }
    if (section.academicYearId !== data.academicYearId || !section.gradeLevelId) {
      throw new BadRequestException('Select a canonical class section for the selected academic year');
    }
    if (section.gradeLevelId !== data.gradeLevelId) {
      throw new BadRequestException('The selected section does not belong to the supplied grade');
    }

    if (section.capacity) {
      const currentEnrollmentCount = await this.prisma.studentEnrollment.count({
        where: { classSectionId: data.classSectionId, status: 'ACTIVE' }
      });

      if (currentEnrollmentCount >= section.capacity) {
        throw new ConflictException('This class section has reached its maximum capacity.');
      }
    }

    const existingEnrollment = await this.prisma.studentEnrollment.findFirst({
      where: {
        studentId: data.studentId,
        academicYearId: data.academicYearId
      }
    });

    if (existingEnrollment) {
      throw new ConflictException('Student is already enrolled in this academic year.');
    }

    return this.prisma.$transaction(async (tx) => {
      const enrollment = await tx.studentEnrollment.create({
        data: {
          studentId: data.studentId,
          academicYearId: data.academicYearId,
          gradeLevelId: section.gradeLevelId!,
          classSectionId: section.id,
          enrollmentDate: new Date(data.enrollmentDate),
          status: data.status,
        },
      });
      // Kept temporarily for legacy profile readers; enrollment is canonical.
      await tx.student.update({ where: { id: data.studentId }, data: { classSectionId: section.id } });
      return enrollment;
    });
  }
}
