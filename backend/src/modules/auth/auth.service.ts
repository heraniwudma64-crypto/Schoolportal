import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type SafeAuthUser = {
  id: string;
  name: string;
  loginId: string;
  email: string | null;
  role: Lowercase<Role>;
};

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    // Initialize Nodemailer transporter with your Gmail SMTP settings from .env
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports like 587
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async register(registerDto: RegisterDto & { classId?: string; classSectionId?: string; grade?: string }) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Password confirmation does not match');
    }

    const loginId = registerDto.idNumber.trim();
    const email = registerDto.email?.trim().toLowerCase();
    const role = this.mapRegisterRole(registerDto.role);

    if (role === Role.STUDENT) {
      const required = ['institutionId', 'institutionName', 'fatherName', 'grandfatherName', 'admissionType', 'gender', 'dob', 'nationality', 'familyKebele', 'locationType', 'fatherEducationLevel', 'motherEducationLevel', 'economicStatus', 'guardianFullName', 'familyHeadGender', 'guardianEmail', 'guardianPhone', 'nationalId', 'residenceRegion', 'residenceZone', 'residenceWoreda', 'birthRegion', 'birthZone', 'birthWoreda', 'parentStatus'];
      const missing = required.filter((field) => !String((registerDto as unknown as Record<string, unknown>)[field] ?? '').trim());
      if (missing.length) throw new BadRequestException(`Missing required student registration information: ${missing.join(', ')}`);
      if (registerDto.disability === 'yes' && !registerDto.disabilityType?.trim()) {
        throw new BadRequestException('Disability type is required when disability is Yes');
      }
    }

    const existingByLoginId = await this.prisma.user.findUnique({
      where: { loginId },
      select: { id: true },
    });
    if (existingByLoginId) {
      throw new ConflictException('A user with that ID number already exists');
    }

    if (email) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existingByEmail) {
        throw new ConflictException('A user with that email already exists');
      }
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);
    const userId = randomUUID();

    const nameParts = registerDto.name ? registerDto.name.trim().split(/\s+/) : ['User'];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    const createdUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: userId,
          loginId,
          name: registerDto.name.trim(),
          email,
          password: passwordHash,
          role,
        },
        select: {
          id: true,
          loginId: true,
          email: true,
          role: true,
        },
      });

      if (role === Role.TEACHER) {
        await tx.teacher.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            firstName,
            lastName,
            updatedAt: new Date(),
          },
        });
      } else if (role === Role.STUDENT) {
        const classInput = (registerDto as any).classSectionId || (registerDto as any).classId || (registerDto as any).grade;
        let resolvedClassSectionId: string | null = null;
        const currentYear = classInput
          ? await tx.academicYear.findFirst({ where: { isCurrent: true }, select: { id: true } })
          : null;

        if (classInput) {
          const normalizedInput = String(classInput).trim();
          if (!currentYear) {
            throw new BadRequestException('A current academic year must be set before selecting a class section');
          }
          let sectionRecord = await tx.classSection.findFirst({
            where: {
              AND: [
                { academicYearId: currentYear.id, gradeLevelId: { not: null } },
                {
                  OR: [
                    { id: normalizedInput },
                    // A full display label is accepted only when it resolves to
                    // an existing grade/section pair; never create a raw class.
                    { name: normalizedInput },
                  ],
                },
              ],
            },
          });

          if (!sectionRecord) {
            const match = normalizedInput.match(/^grade\s*(\d+)\s*([a-z][a-z0-9]{0,3})$/i);
            if (match) {
              sectionRecord = await tx.classSection.findFirst({
                where: {
                  name: match[2].toUpperCase(),
                  academicYearId: currentYear.id,
                  GradeLevel: {
                    OR: [
                      { gradeNumber: Number(match[1]) },
                      { name: `Grade ${match[1]}` },
                    ],
                  },
                },
              });
            }
          }

          if (!sectionRecord || !sectionRecord.gradeLevelId || !sectionRecord.academicYearId) {
            throw new BadRequestException('Select a valid class and section, for example Grade 10 A');
          }
          resolvedClassSectionId = sectionRecord.id;
        }

        const student = await tx.student.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            admissionNo: loginId,
            firstName,
            lastName,
            gender: registerDto.gender,
            institutionId: registerDto.institutionId?.trim(),
            institutionName: registerDto.institutionName?.trim(),
            fatherName: registerDto.fatherName?.trim(),
            grandfatherName: registerDto.grandfatherName?.trim(),
            admissionType: registerDto.admissionType?.trim(),
            hasDisability: registerDto.disability === 'yes',
            disabilityType: registerDto.disability === 'yes' ? registerDto.disabilityType?.trim() : null,
            dob: registerDto.dob ? new Date(registerDto.dob) : undefined,
            nationality: registerDto.nationality?.trim(),
            familyKebele: registerDto.familyKebele?.trim(),
            locationType: registerDto.locationType?.trim(),
            fatherEducationLevel: registerDto.fatherEducationLevel?.trim(),
            motherEducationLevel: registerDto.motherEducationLevel?.trim(),
            economicStatus: registerDto.economicStatus?.trim(),
            guardianFullName: registerDto.guardianFullName?.trim(),
            familyHeadGender: registerDto.familyHeadGender?.trim(),
            guardianEmail: registerDto.guardianEmail?.trim().toLowerCase(),
            guardianPhone: registerDto.guardianPhone?.trim(),
            nationalId: registerDto.nationalId?.trim(),
            residenceRegion: registerDto.residenceRegion?.trim(),
            residenceZone: registerDto.residenceZone?.trim(),
            residenceWoreda: registerDto.residenceWoreda?.trim(),
            birthRegion: registerDto.birthRegion?.trim(),
            birthZone: registerDto.birthZone?.trim(),
            birthWoreda: registerDto.birthWoreda?.trim(),
            parentStatus: registerDto.parentStatus?.trim(),
            updatedAt: new Date(),
            ...(resolvedClassSectionId ? { classSectionId: resolvedClassSectionId } : {}),
          },
        });
        if (resolvedClassSectionId) {
          const section = await tx.classSection.findUnique({
            where: { id: resolvedClassSectionId },
            select: { academicYearId: true, gradeLevelId: true },
          });
          if (!section?.academicYearId || !section.gradeLevelId || section.academicYearId !== currentYear?.id) {
            throw new BadRequestException('Select a class section from the current academic year');
          }
          await tx.studentEnrollment.create({
            data: {
              studentId: student.id,
              academicYearId: section.academicYearId,
              gradeLevelId: section.gradeLevelId,
              classSectionId: resolvedClassSectionId,
              status: 'ACTIVE',
            },
          });
        }
      }

      return user;
    });

    const safeUser = this.toSafeUser(createdUser, registerDto.name);
    const accessToken = await this.signToken(createdUser.id, createdUser.role);

    return {
      accessToken,
      user: safeUser,
    };
  }

  async getTeacherPermissions(userId: string) {
  // 1. Find the teacher record using their user ID
  const teacher = await this.prisma.teacher.findUnique({
    where: { userId },
    include: { homeroomSections: true }, // This uses the "HomeroomTeacher" relation from your schema
  });

  if (!teacher) {
    throw new NotFoundException('Teacher not found');
  }

  // 2. Check if they have at least one homeroom section assigned
  const isHomeroomTeacher = teacher.homeroomSections.length > 0;

  // 3. Return their info plus the permission flag
  return {
    id: teacher.id,
    name: `${teacher.firstName} ${teacher.lastName}`,
    isHomeroomTeacher, // true or false
  };
}

  async login(loginDto: LoginDto) {
    const identifier = [
      loginDto.identifier,
      loginDto.loginId,
      loginDto.idNumber,
      loginDto.username,
      loginDto.email,
    ].find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim();

    if (!identifier) {
      throw new BadRequestException('An ID number, username, or email is required');
    }

    const emailIdentifier = identifier.toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { loginId: { equals: identifier, mode: 'insensitive' } },
          { email: { equals: emailIdentifier, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        loginId: true,
        email: true,
        password: true,
        role: true,
        name: true,
        avatarUrl: true,
        isActive: true,
        isDeleted: true,
        Teacher: { select: { firstName: true, lastName: true } },
        Student: { select: { firstName: true, lastName: true } },
        Parent: { select: { firstName: true, lastName: true } },
      },
    });

    if (!user || !user.isActive || user.isDeleted) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(loginDto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: { id: true },
    });

    const safeUser = this.toSafeUser(user);
    const accessToken = await this.signToken(user.id, user.role);

    return {
      accessToken,
      user: safeUser,
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    // For security reasons, don't reveal if the email exists or not
    if (!user) {
      return { message: 'If the email exists, a password reset code has been sent.' };
    }

    // 1. Generate a random 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // Valid for 15 minutes

    // 2. Save the OTP code and expiration to your user database table
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        resetOtpExpiresAt: otpExpiresAt,
      },
    });

    // 3. Send the real email via Nodemailer
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.MAIL_USER,
        to: normalizedEmail,
        subject: 'Password Reset Code - School Portal',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your school portal account.</p>
            <p>Your verification code is:</p>
            <h1 style="color: #4F46E5; letter-spacing: 2px;">${otp}</h1>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new InternalServerErrorException('Failed to send password reset email. Please try again later.');
    }

    return { message: 'Password reset OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || user.resetOtp !== otp || !user.resetOtpExpiresAt || user.resetOtpExpiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    return { message: 'OTP verified successfully' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    if (!user || user.resetOtp !== otp || !user.resetOtpExpiresAt || user.resetOtpExpiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP request');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { email: normalizedEmail },
      data: { 
        password: passwordHash,
        resetOtp: null,
        resetOtpExpiresAt: null,
      },
    });

    return { message: 'Password has been reset successfully' };
  }

  /**
   * Resolves homeroom duty from ClassSection.teacherId. Subject assignments
   * live in SectionSubjectTeacher and must not grant homeroom access.
   */
  async getHomeroomContext(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!teacher) {
      return { isHomeroomTeacher: false, assignedSection: null };
    }

    const section = await this.prisma.classSection.findFirst({
      where: { teacherId: teacher.id },
      select: {
        id: true,
        name: true,
        GradeLevel: { select: { name: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });

    if (!section) {
      return { isHomeroomTeacher: false, assignedSection: null };
    }

    return {
      isHomeroomTeacher: true,
      assignedSection: {
        id: section.id,
        name: section.name,
        grade: section.GradeLevel?.name ?? null,
        studentCount: section._count.students,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        loginId: true,
        email: true,
        role: true,
        name: true,
        isActive: true,
        isDeleted: true,
        Teacher: { select: { firstName: true, lastName: true } },
        Student: { select: { firstName: true, lastName: true } },
        Parent: { select: { firstName: true, lastName: true } },
      },
    });

    if (!user || !user.isActive || user.isDeleted) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.toSafeUser(user);
  }

  private async signToken(userId: string, role: Role) {
    return this.jwtService.signAsync({
      sub: userId,
      role,
    });
  }

  private mapRegisterRole(role?: string): Role {
    const normalized = role?.toLowerCase();
    if (!normalized) {
      return Role.STUDENT;
    }
    if (normalized === 'admin') {
      throw new UnauthorizedException('Admin accounts cannot be created via public registration');
    }
    if (normalized === 'teacher') {
      return Role.TEACHER;
    }
    if (normalized === 'parent') {
      return Role.PARENT;
    }
    return Role.STUDENT;
  }

  private toSafeUser(
    user: any,
    nameOverride?: string,
  ) {
    let name = (user as any).name || user.loginId; // Fallback to User.name, then loginId

    if (nameOverride) {
      name = nameOverride.trim();
    } else if (user.Student) {
      name = `${user.Student.firstName} ${user.Student.lastName}`;
    } else if (user.Teacher) {
      name = `${user.Teacher.firstName} ${user.Teacher.lastName}`;
    } else if (user.Parent) {
      name = `${user.Parent.firstName} ${user.Parent.lastName}`;
    }

    return {
      id: user.id,
      loginId: user.loginId,
      email: user.email,
      role: user.role.toLowerCase() as Lowercase<Role>,
      name,
      avatarUrl: user.avatarUrl,
    };
  }
}
