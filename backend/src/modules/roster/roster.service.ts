import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class RosterService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.studentEnrollment.create({
      data: {
        studentId: data.studentId,
        academicYearId: data.academicYearId,
        gradeLevelId: data.gradeLevelId,
        classSectionId: data.classSectionId,
        enrollmentDate: new Date(data.enrollmentDate),
        status: data.status,
      }
    });
  }
}
