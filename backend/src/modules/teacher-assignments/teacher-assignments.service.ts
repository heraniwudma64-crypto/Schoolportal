import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TeacherAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomeRoomAssignments(academicYearId?: string) {
    let yearId = academicYearId;
    if (!yearId) {
      const currentYear = await this.prisma.academicYear.findFirst({ where: { isCurrent: true } });
      if (currentYear) yearId = currentYear.id;
    }

    if (!yearId) return [];

    const sections = await this.prisma.classSection.findMany({
      where: { academicYearId: yearId },
      include: {
        GradeLevel: true,
        Teacher: true,
      },
      orderBy: [
        { GradeLevel: { gradeNumber: 'asc' } },
        { name: 'asc' }
      ]
    });

    return sections.map(sec => ({
      id: sec.id, 
      classSectionId: sec.id,
      grade: sec.GradeLevel?.name || 'Unknown Grade',
      section: sec.name,
      teacher: sec.Teacher ? {
        id: sec.Teacher.id,
        name: `${sec.Teacher.firstName} ${sec.Teacher.lastName}`,
        staffId: sec.Teacher.staffId
      } : null,
      academicYearId: sec.academicYearId
    }));
  }

  async assignHomeRoomTeacher(classSectionId: string, teacherId: string | null) {
    const section = await this.prisma.classSection.findUnique({ where: { id: classSectionId } });
    if (!section) throw new NotFoundException('Section not found');

    if (teacherId) {
      const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
      if (!teacher) throw new NotFoundException('Teacher not found');
    }

    return this.prisma.classSection.update({
      where: { id: classSectionId },
      data: { teacherId: teacherId },
      include: {
        GradeLevel: true,
        Teacher: true
      }
    });
  }

  async getSubjectAssignments(academicYearId?: string) {
    let yearId = academicYearId;
    if (!yearId) {
      const currentYear = await this.prisma.academicYear.findFirst({ where: { isCurrent: true } });
      if (currentYear) yearId = currentYear.id;
    }

    if (!yearId) return [];

    const assignments = await this.prisma.sectionSubjectTeacher.findMany({
      where: { academicYearId: yearId },
      include: {
        ClassSection: { include: { GradeLevel: true } },
        Subject: true,
        Teacher: true,
        AcademicYear: true,
      },
      orderBy: [
        { ClassSection: { GradeLevel: { gradeNumber: 'asc' } } },
        { ClassSection: { name: 'asc' } },
        { Subject: { name: 'asc' } }
      ]
    });

    return assignments.map(a => ({
      id: a.id,
      classSectionId: a.classSectionId,
      grade: a.ClassSection.GradeLevel?.name || 'Unknown Grade',
      section: a.ClassSection.name,
      subject: {
        id: a.Subject.id,
        name: a.Subject.name,
        code: a.Subject.code
      },
      teacher: {
        id: a.Teacher.id,
        name: `${a.Teacher.firstName} ${a.Teacher.lastName}`,
        staffId: a.Teacher.staffId
      },
      academicYear: {
        id: a.AcademicYear.id,
        year: a.AcademicYear.year
      }
    }));
  }

  async assignSubjectTeacher(classSectionId: string, subjectId: string, teacherId: string, academicYearId: string) {
    const section = await this.prisma.classSection.findUnique({ 
      where: { id: classSectionId },
      include: { GradeLevel: true }
    });
    if (!section) throw new NotFoundException('Section not found');
    
    // Allow sections that do not strictly have academicYearId set to still be validated against the parameter if business rules allow, 
    // but typically we should enforce section year matches parameter year if section.academicYearId is set.
    if (section.academicYearId && section.academicYearId !== academicYearId) {
        throw new BadRequestException('Section does not belong to the supplied Academic Year');
    }

    const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException('Subject not found');

    if (!section.gradeLevelId) throw new BadRequestException('Section has no associated grade level');

    const gradeSubject = await this.prisma.gradeSubject.findUnique({
      where: {
        academicYearId_gradeLevelId_subjectId: {
          academicYearId: academicYearId,
          gradeLevelId: section.gradeLevelId,
          subjectId: subjectId
        }
      }
    });

    // If there's no gradeSubject mapped with the academicYearId, fallback to a global check without academicYearId if allowed by schema.
    if (!gradeSubject) {
      const globalGradeSubject = await this.prisma.gradeSubject.findFirst({
        where: {
          gradeLevelId: section.gradeLevelId,
          subjectId: subjectId,
          academicYearId: null
        }
      });
      if (!globalGradeSubject) {
        throw new BadRequestException('Subject is not assigned to this Grade in the curriculum');
      }
    }

    const existing = await this.prisma.sectionSubjectTeacher.findUnique({
      where: {
        classSectionId_subjectId_academicYearId: {
          classSectionId,
          subjectId,
          academicYearId
        }
      }
    });

    if (existing) {
      return this.prisma.sectionSubjectTeacher.update({
        where: { id: existing.id },
        data: { teacherId }
      });
    }

    return this.prisma.sectionSubjectTeacher.create({
      data: {
        classSectionId,
        subjectId,
        teacherId,
        academicYearId
      }
    });
  }

  async removeSubjectTeacher(id: string) {
    return this.prisma.sectionSubjectTeacher.delete({
      where: { id }
    });
  }
}
