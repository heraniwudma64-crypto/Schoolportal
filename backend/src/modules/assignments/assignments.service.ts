import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.assignment.findMany();
  }
  
  async findTeacherAssignments(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Teacher profile not found');
    return this.prisma.assignment.findMany({ where: { teacherId: teacher.id }, include: { ClassSection: true, submissions: { include: { student: true } } }, orderBy: { createdAt: 'desc' } });
  }
  
  async findSubmissions(id: string, userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    const assignment = await this.prisma.assignment.findFirst({ where: { id, teacherId: teacher?.id }, select: { id: true } });
    if (!assignment) throw new UnauthorizedException('You cannot view submissions for this assignment');
    return this.prisma.submission.findMany({ where: { assignmentId: id }, include: { student: true, grades: true }, orderBy: { createdAt: 'desc' } });
  }

  async create(data: any, userId?: string) {
    if (!userId) throw new UnauthorizedException('User unauthenticated');
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');

    const subjectId = data.subjectId;
    const classSectionId = data.classSectionId;
    if (!subjectId || !classSectionId) {
      throw new BadRequestException('Subject and assigned section are required');
    }

    const teachingAssignment = await this.prisma.sectionSubjectTeacher.findFirst({
      where: { teacherId: teacher.id, subjectId, classSectionId },
      include: { Subject: true, ClassSection: true },
    });
    if (!teachingAssignment) {
      throw new BadRequestException('You are not assigned to this subject and section');
    }

    return this.prisma.assignment.create({
      data: {
        title: data.title,
        subject: teachingAssignment.Subject.name,
        targetClass: teachingAssignment.ClassSection.name,
        classSectionId,
        classId: data.classId || null,
        description: data.description || data.instructions,
        instructions: data.instructions || data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
        attachmentUrl: data.attachmentUrl || null,
        teacherId: teacher.id,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.assignment.findUnique({ where: { id } });
  }

  async delete(id: string) {
    return this.prisma.assignment.delete({ where: { id } });
  }
}