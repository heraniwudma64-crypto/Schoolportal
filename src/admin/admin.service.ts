import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { CreateParentDto } from './dto/create-parent.dto';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomic Registration for Student Account + Profile
   */
  async registerStudent(dto: CreateStudentDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { loginId: dto.loginId },
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('Login ID or Email already registered');
    }

    const existingAdmission = await this.prisma.student.findUnique({
      where: { admissionNo: dto.admissionNo },
    });

    if (existingAdmission) {
      throw new ConflictException('Admission number already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          loginId: dto.loginId,
          password: hashedPassword,
          email: dto.email,
          role: Role.STUDENT,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          admissionNo: dto.admissionNo,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dob: dto.dob ? new Date(dto.dob) : null,
          gender: dto.gender,
          address: dto.address,
          emergencyContact: dto.emergencyContact,
          classSectionId: dto.classSectionId,
          parentId: dto.parentId,
        },
      });

      return {
        message: 'Student account and profile created successfully',
        userId: user.id,
        studentId: student.id,
        admissionNo: student.admissionNo,
        role: user.role,
      };
    });
  }

  /**
   * Atomic Registration for Teacher Account + Profile
   */
  async registerTeacher(dto: CreateTeacherDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { loginId: dto.loginId },
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('Login ID or Email already registered');
    }

    if (dto.staffId) {
      const existingStaff = await this.prisma.teacher.findUnique({
        where: { staffId: dto.staffId },
      });
      if (existingStaff) {
        throw new ConflictException('Teacher Staff ID already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          loginId: dto.loginId,
          password: hashedPassword,
          email: dto.email,
          role: Role.TEACHER,
          phoneNumber: dto.phoneNumber,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          staffId: dto.staffId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          qualification: dto.qualification,
          phoneNumber: dto.phoneNumber,
        },
      });

      return {
        message: 'Teacher account and profile created successfully',
        userId: user.id,
        teacherId: teacher.id,
        staffId: teacher.staffId,
        role: user.role,
      };
    });
  }

  /**
   * Atomic Registration for Parent Account + Profile
   */
  async registerParent(dto: CreateParentDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { loginId: dto.loginId },
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('Login ID or Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          loginId: dto.loginId,
          password: hashedPassword,
          email: dto.email,
          role: Role.PARENT,
          phoneNumber: dto.phoneNumber,
        },
      });

      const parent = await tx.parent.create({
        data: {
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          relationship: dto.relationship,
          phoneNumber: dto.phoneNumber,
          occupation: dto.occupation,
        },
      });

      return {
        message: 'Parent account and profile created successfully',
        userId: user.id,
        parentId: parent.id,
        role: user.role,
      };
    });
  }

  /**
   * Get System Users List
   */
  async getAllUsers(role?: Role) {
    return await this.prisma.user.findMany({
      where: role ? { role, isDeleted: false } : { isDeleted: false },
      select: {
        id: true,
        loginId: true,
        email: true,
        role: true,
        isActive: true,
        phoneNumber: true,
        createdAt: true,
        student: true,
        teacher: true,
        parent: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Toggle Active / Inactive Status of a User
   */
  async toggleUserStatus(userId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, loginId: true, role: true, isActive: true },
    });

    return {
      message: `User status successfully updated to ${isActive ? 'ACTIVE' : 'INACTIVE'}`,
      user: updatedUser,
    };
  }

  /**
   * Academic Year Management
   */
  async createAcademicYear(dto: CreateAcademicYearDto) {
    const existing = await this.prisma.academicYear.findUnique({
      where: { year: dto.year },
    });

    if (existing) {
      throw new ConflictException('Academic year already exists');
    }

    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        data: { isCurrent: false },
      });
    }

    return await this.prisma.academicYear.create({
      data: {
        year: dto.year,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isCurrent: dto.isCurrent ?? false,
      },
    });
  }

  /**
   * Subject Registry Management
   */
  async createSubject(dto: CreateSubjectDto) {
    const existing = await this.prisma.subject.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Subject code already exists');
    }

    return await this.prisma.subject.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
      },
    });
  }
}
