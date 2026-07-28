import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async getTeacherProfile(userId: string) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        loginId: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return {
      message: 'Welcome to your teacher dashboard',
      teacher,
    };
  }
}