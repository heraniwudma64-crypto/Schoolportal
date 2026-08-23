import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.assignment.findMany();
  }

  async create(data: any) {
    return this.prisma.assignment.create({
      data,
    });
  }

  async findOne(id: string) {
    return this.prisma.assignment.findUnique({
      where: { id },
    });
  }

  async delete(id: string) {
    return this.prisma.assignment.delete({
      where: { id },
    });
  }
}