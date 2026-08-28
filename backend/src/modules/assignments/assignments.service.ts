import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { randomUUID } from 'node:crypto';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.assignment.findMany();
  }

  async create(data: any, userId?: string) {
    let teacher = null;

    // 1. Try finding teacher by the provided userId
    if (userId) {
      teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });
    }

    // 2. If not found by userId, try finding by teacherId if passed in data
    if (!teacher && data.teacherId && data.teacherId !== 'CURRENT_TEACHER_ID') {
      teacher = await this.prisma.teacher.findUnique({
        where: { id: data.teacherId },
      });
    }

    // 3. Fallback: Grab the very first teacher in the database
    if (!teacher) {
      teacher = await this.prisma.teacher.findFirst();
    }

    // 4. Ultimate fallback: Create a default teacher on the fly if none exist
    if (!teacher) {
      const defaultUser = await this.prisma.user.findFirst();
      if (!defaultUser) {
        throw new BadRequestException('No users found in database. Please register an account first.');
      }
      teacher = await this.prisma.teacher.create({
        data: {
          id: randomUUID(),
          userId: defaultUser.id,
          firstName: 'Default',
          lastName: 'Teacher',
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.assignment.create({
      data: {
        title: data.title,
        subject: data.subject,
        targetClass: data.targetClass,
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