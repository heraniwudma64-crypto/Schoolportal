import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async publishAssignment(dto: CreateAssignmentDto) {
    // 1. Fetch all students belonging to the target class
    const studentsInClass = await this.prisma.student.findMany({
      where: { class: dto.targetClass },
    });

    if (!studentsInClass || studentsInClass.length === 0) {
      throw new NotFoundException(`No students found in class '${dto.targetClass}' to distribute this assignment.`);
    }

    // 2. Create the assignment and distribute it to each student via a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // Create the main assignment record
      const assignment = await prisma.assignment.create({
        data: {
          title: dto.title,
          instructions: dto.instructions,
          subject: dto.subject,
          targetClass: dto.targetClass,
          dueDate: new Date(dto.dueDate),
          attachmentUrl: dto.attachmentUrl || null,
        },
      });

      // Create a student-assignment distribution record for every student in the class
      const distributionData = studentsInClass.map((student) => ({
        assignmentId: assignment.id,
        studentLoginId: student.loginId,
        status: 'PENDING',
      }));

      await prisma.studentAssignment.createMany({
        data: distributionData,
      });

      return { assignment, totalRecipients: studentsInClass.length };
    });

    return {
      message: `Assignment successfully published and sent to ${result.totalRecipients} students in ${dto.targetClass}!`,
      data: result.assignment,
    };
  }

  async getRecentPublications() {
    return this.prisma.assignment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }
}