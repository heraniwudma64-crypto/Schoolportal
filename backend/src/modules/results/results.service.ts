import { Injectable, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ResultsService {
  constructor(private readonly prisma: PrismaService) {}

  // Subject Teacher saves draft or updates marks
  private async getTeacher(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');
    return teacher;
  }

  private async assertAssignment(userId: string, classSectionId: string, subjectId: string, academicYearId: string) {
    const teacher = await this.getTeacher(userId);
    const assignment = await (this.prisma as any).sectionSubjectTeacher.findFirst({ where: { teacherId: teacher.id, classSectionId, subjectId, academicYearId } });
    if (!assignment) throw new ForbiddenException('You are not assigned to this subject and section');
  }

  private async getActiveRosterStudentIds(classSectionId: string, academicYearId: string) {
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { classSectionId, academicYearId, status: 'ACTIVE' },
      select: { studentId: true },
    });
    return new Set(enrollments.map((enrollment) => enrollment.studentId));
  }

  async saveGradesDraft(dto: {
    classSectionId: string;
    subjectId: string;
    academicYearId: string;
    term: string;
    grades: Array<{ studentId: string; marks: number }>;
  }, userId: string) {
    await this.assertAssignment(userId, dto.classSectionId, dto.subjectId, dto.academicYearId);
    const enrolledIds = await this.getActiveRosterStudentIds(dto.classSectionId, dto.academicYearId);
    // The client can retain a stale row after an enrollment transfer. Save
    // active-roster grades and report ignored rows instead of rejecting class work.
    const validGrades = dto.grades.filter((grade) => enrolledIds.has(grade.studentId));
    const ignoredStudentIds = dto.grades
      .filter((grade) => !enrolledIds.has(grade.studentId))
      .map((grade) => grade.studentId);
    const submittedResultCount = await (this.prisma as any).subjectResult.count({
      where: {
        classSectionId: dto.classSectionId,
        subjectId: dto.subjectId,
        academicYearId: dto.academicYearId,
        term: dto.term,
        status: 'SUBMITTED',
      },
    });
    if (submittedResultCount > 0) {
      throw new BadRequestException('Submitted results are locked. Ask the homeroom teacher to return them for correction.');
    }
    const operations = validGrades.map((g) =>
      (this.prisma as any).subjectResult.upsert({
        where: {
          studentId_subjectId_classSectionId_academicYearId_term: {
            studentId: g.studentId,
            subjectId: dto.subjectId,
            classSectionId: dto.classSectionId,
            academicYearId: dto.academicYearId,
            term: dto.term,
          },
        },
        update: { marks: g.marks },
        create: {
          studentId: g.studentId,
          subjectId: dto.subjectId,
          classSectionId: dto.classSectionId,
          academicYearId: dto.academicYearId,
          term: dto.term,
          marks: g.marks,
          status: 'DRAFT',
        },
      })
    );
    const results = operations.length ? await this.prisma.$transaction(operations) : [];
    return { results, savedCount: results.length, ignoredStudentIds };
  }

  async publishStudentResult(dto: { classSectionId: string; subjectId: string; academicYearId: string; term: string; studentId: string }, userId: string) {
    await this.assertAssignment(userId, dto.classSectionId, dto.subjectId, dto.academicYearId);
    
    const activeStudentIds = await this.getActiveRosterStudentIds(dto.classSectionId, dto.academicYearId);
    if (!activeStudentIds.has(dto.studentId)) {
      throw new BadRequestException('Student is not actively enrolled in this class section for the selected academic year');
    }

    // Verify result exists for this student with marks
    const existingResult = await (this.prisma as any).subjectResult.findUnique({
      where: {
        studentId_subjectId_classSectionId_academicYearId_term: {
          studentId: dto.studentId,
          subjectId: dto.subjectId,
          classSectionId: dto.classSectionId,
          academicYearId: dto.academicYearId,
          term: dto.term
        }
      }
    });
    if (!existingResult) {
      throw new BadRequestException('Save this student result before publishing');
    }

    // Publish the result
    const result = await (this.prisma as any).subjectResult.update({
      where: {
        studentId_subjectId_classSectionId_academicYearId_term: {
          studentId: dto.studentId,
          subjectId: dto.subjectId,
          classSectionId: dto.classSectionId,
          academicYearId: dto.academicYearId,
          term: dto.term
        }
      },
      data: { status: 'SUBMITTED' }
    });
    return { success: true, count: 1, result };
  }

  // Subject Teacher submits grades to Homeroom Teacher (Locks editing)
  async submitToHomeroom(dto: { classSectionId: string; subjectId: string; academicYearId: string; term: string; homeroomTeacherId?: string }, userId: string) {
    await this.assertAssignment(userId, dto.classSectionId, dto.subjectId, dto.academicYearId);
    
    // Verify the class section exists
    const classSection = await this.prisma.classSection.findUnique({
      where: { id: dto.classSectionId },
      include: { Teacher: true }
    });
    if (!classSection) {
      throw new BadRequestException('Class section not found');
    }

    // Results always belong to the teacher assigned to this section's homeroom.
    // Accepting an arbitrary teacher here made submissions disappear from the
    // actual homeroom teacher's matrix.
    const homeroomTeacherId = classSection.teacherId;
    if (!homeroomTeacherId) {
      throw new BadRequestException('No homeroom teacher assigned to this class section');
    }

    const activeStudentIds = await this.getActiveRosterStudentIds(dto.classSectionId, dto.academicYearId);
    const enrolledCount = activeStudentIds.size;
    const resultCount = await (this.prisma as any).subjectResult.count({
      where: { classSectionId: dto.classSectionId, subjectId: dto.subjectId, academicYearId: dto.academicYearId, term: dto.term, studentId: { in: [...activeStudentIds] } },
    });
    if (resultCount === 0) throw new BadRequestException('Save at least one result before submitting');
    if (enrolledCount > 0 && resultCount < enrolledCount) {
      throw new BadRequestException(`Complete results for all ${enrolledCount} enrolled students before submitting`);
    }
    const updated = await (this.prisma as any).subjectResult.updateMany({
      where: { classSectionId: dto.classSectionId, subjectId: dto.subjectId, academicYearId: dto.academicYearId, term: dto.term, studentId: { in: [...activeStudentIds] } },
      data: { status: 'SUBMITTED' },
    });
    return { success: true, count: updated.count, homeroomTeacherId };
  }

  // Homeroom Teacher checks submission status across all subjects
  async getHomeroomSubmissionMatrix(classSectionId: string, academicYearId: string, term: string, userId: string) {
    const homeroom = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    const section = homeroom && await this.prisma.classSection.findFirst({
      where: { id: classSectionId, teacherId: homeroom.id },
      include: { AcademicYear: true, GradeLevel: true },
    });
    if (!section) throw new ForbiddenException('Only the homeroom teacher can view this submission matrix');
    const enrolledCount = await this.prisma.studentEnrollment.count({
      where: { classSectionId, academicYearId, status: 'ACTIVE' },
    });
    const assignedSubjects = await (this.prisma as any).sectionSubjectTeacher.findMany({
      where: { classSectionId, academicYearId },
      include: { Subject: true, Teacher: true },
      orderBy: { Subject: { name: 'asc' } },
    });

    const matrix = await Promise.all(
      assignedSubjects.map(async (assignment: any) => {
        const submittedResults = await (this.prisma as any).subjectResult.findMany({
          where: {
            classSectionId,
            subjectId: assignment.subjectId,
            academicYearId,
            term,
            status: 'SUBMITTED',
          },
          select: { studentId: true, updatedAt: true },
        });
        const submittedCount = new Set(submittedResults.map((result: any) => result.studentId)).size;
        const submittedAt = submittedResults.length
          ? submittedResults.reduce((latest: Date, result: any) => result.updatedAt > latest ? result.updatedAt : latest, submittedResults[0].updatedAt)
          : null;

        return {
          subjectId: assignment.subjectId,
          subjectName: assignment.Subject.name,
          subjectCode: assignment.Subject.code,
          teacherId: assignment.teacherId,
          teacherName: `${assignment.Teacher.firstName} ${assignment.Teacher.lastName}`,
          submittedCount,
          enrolledCount,
          isSubmitted: enrolledCount > 0 && submittedCount === enrolledCount,
          completionPercentage: enrolledCount ? Math.round((submittedCount / enrolledCount) * 100) : 0,
          submittedAt,
        };
      })
    );

    const allSubmitted = matrix.length > 0 && matrix.every((item) => item.isSubmitted);
    return {
      allSubmitted,
      subjects: matrix,
      matrix,
      totalSubmitted: matrix.filter((item) => item.isSubmitted).length,
      totalSubjects: matrix.length,
      classSectionName: [section.GradeLevel?.name, section.name].filter(Boolean).join(' '),
      academicYear: section.AcademicYear?.year ?? academicYearId,
      term,
    };
  }

  // Get available homeroom teachers for a class section
  async getHomeroomTeachers(classSectionId: string, academicYearId: string) {
    // Get the class section with its current homeroom teacher
    const classSection = await this.prisma.classSection.findUnique({
      where: { id: classSectionId },
      include: {
        Teacher: {
          select: { id: true, userId: true, firstName: true, lastName: true }
        }
      }
    });

    if (!classSection) {
      throw new BadRequestException('Class section not found');
    }

    if (!classSection.Teacher) {
      throw new BadRequestException('No homeroom teacher assigned to this class section');
    }

    // A subject result must be sent to the section's actual homeroom teacher.
    // Offering subject teachers as alternate recipients caused invisible results.
    const teachers = [{
        id: classSection.Teacher.id,
        name: `${classSection.Teacher.firstName} ${classSection.Teacher.lastName}`,
        isCurrentHomeroom: true
    }];

    return {
      classSectionId,
      teachers,
      defaultHomeroomTeacherId: classSection.teacherId
    };
  }

  // Get all student results for a given class, term
  async getStudentResults(classSectionId: string, academicYearId: string, term: string, userId: string) {
    // Verify user is homeroom teacher for this section
    const teacher = await this.getTeacher(userId);
    const section = await this.prisma.classSection.findFirst({
      where: { id: classSectionId, teacherId: teacher.id }
    });
    if (!section) throw new ForbiddenException('Only the homeroom teacher can view student results');

    // Fetch all submitted results for this section/term
    const results = await (this.prisma as any).subjectResult.findMany({
      where: {
        classSectionId,
        academicYearId,
        term,
        status: 'SUBMITTED'
      },
      include: { 
        Student: { select: { admissionNo: true, firstName: true, lastName: true } },
        Subject: true
      },
      orderBy: [{ studentId: 'asc' }, { subjectId: 'asc' }]
    });

    return results.map((result: any) => ({
      studentId: result.studentId,
      admissionNo: result.Student.admissionNo,
      studentName: `${result.Student.firstName} ${result.Student.lastName}`,
      marks: result.marks,
      subjectId: result.subjectId,
      term: result.term,
      status: result.status
    }));
  }
}
