import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Controller('students')
export class StudentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getStudentsByClass(@Query('className') className: string) {
    return this.prisma.student.findMany({
      where: className ? {
        OR: [
          { ClassSection: { name: className } },
        
        ]
      } : undefined,
      include: { ClassSection: true }
    });
  }
  async findAll(className?: string) {
  // Fetch all students from Prisma safely
  const students = await this.prisma.student.findMany({
    include: {
      // Include relations if your schema connects students to classes/sections
      ClassSection: true, 
    },
  });

  // If a className query parameter is provided, filter safely in memory 
  // to avoid strict Prisma type mismatches until your schema relation is matched
  if (className) {
    return students.filter((student: any) => 
      student.className === className || 
      student.gradeLevel === className ||
      student.classSection?.name === className
    );
  }

  return students;
}
}