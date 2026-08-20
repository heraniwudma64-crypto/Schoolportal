import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentsBySection(sectionIdentifier: string) {
    // Decode URL-encoded strings (e.g. "Grade%2010A" -> "Grade 10A")
    const decodedIdentifier = decodeURIComponent(sectionIdentifier).trim();

    // 1. Find the class section by matching either its ID or its Name
    const section = await this.prisma.classSection.findFirst({
      where: {
        OR: [
          { id: decodedIdentifier },
          { name: decodedIdentifier },
        ],
      },
    });

    if (!section) {
      return []; // Return empty array if section is not found
    }

    // 2. Fetch students belonging to the resolved section ID
    return this.prisma.student.findMany({
      where: { classSectionId: section.id },
      include: {
        User: {
          select: {
            id: true,
            loginId: true,
            email: true,
          },
        },
      },
      orderBy: { firstName: 'asc' },
    });
  }
}