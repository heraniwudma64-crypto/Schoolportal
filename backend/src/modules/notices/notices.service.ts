import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NoticeStatus, NoticeTargetType, Role, Notice } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface CreateNoticeDto {
  title: string;
  content: string;
  category?: string;
  targetType: NoticeTargetType;
  targetRole?: Role;
  gradeId?: string;
  sectionId?: string;
  studentId?: string;
  parentId?: string;
  status: NoticeStatus;
  scheduledAt?: Date;
  expiresAt?: Date;
}

export interface UpdateNoticeDto {
  title?: string;
  content?: string;
  category?: string;
  targetType?: NoticeTargetType;
  targetRole?: Role;
  gradeId?: string;
  sectionId?: string;
  studentId?: string;
  parentId?: string;
  status?: NoticeStatus;
  scheduledAt?: Date;
  expiresAt?: Date;
}

@Injectable()
export class NoticesService {
  private isHandling = false; // Add a lock flag
  
  constructor(private prisma: PrismaService) {}

  async createNotice(userId: string, userRole: Role, data: CreateNoticeDto): Promise<Notice> {
    if (userRole === Role.TEACHER) {
      if (data.targetType === NoticeTargetType.GLOBAL || data.targetType === NoticeTargetType.ROLE) {
        throw new ForbiddenException('Teachers cannot create global or role-wide announcements.');
      }
    } else if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to create announcements.');
    }

    const publishedAt = data.status === NoticeStatus.PUBLISHED ? new Date() : null;

    return this.prisma.notice.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category || 'General',
        targetType: data.targetType,
        targetRole: data.targetRole,
        gradeId: data.gradeId,
        sectionId: data.sectionId,
        studentId: data.studentId,
        parentId: data.parentId,
        status: data.status,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        publishedAt,
        authorId: userId,
      },
    });
  }

  async getAdminNotices(): Promise<Notice[]> {
    return this.prisma.notice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        User: { select: { email: true, role: true } },
        GradeLevel: { select: { name: true } },
        ClassSection: { select: { name: true } },
      }
    });
  }

  async getUserNotices(userId: string, userRole: Role): Promise<Notice[]> {
    if (userRole === Role.ADMIN) {
      return this.getAdminNotices();
    }

    const conditions: any[] = [
      { targetType: NoticeTargetType.GLOBAL },
      { targetType: NoticeTargetType.ROLE, targetRole: userRole }
    ];

    if (userRole === Role.STUDENT) {
      const student = await this.prisma.student.findUnique({
        where: { userId },
        select: {
          id: true,
          classSectionId: true,
          StudentEnrollment: {
            where: { status: 'ACTIVE' },
            select: { gradeLevelId: true },
            take: 1,
          },
        },
      });
      if (student) {
        conditions.push({ targetType: NoticeTargetType.STUDENT, studentId: student.id });
        if (student.classSectionId) {
          conditions.push({ targetType: NoticeTargetType.SECTION, sectionId: student.classSectionId });
        }
        if (student.StudentEnrollment?.[0]?.gradeLevelId) {
          conditions.push({ targetType: NoticeTargetType.GRADE, gradeId: student.StudentEnrollment[0].gradeLevelId });
        }
      }
    } else if (userRole === Role.PARENT) {
      const parent = await this.prisma.parent.findUnique({
        where: { userId },
        select: {
          id: true,
          Student: {
            select: {
              id: true,
              classSectionId: true,
              StudentEnrollment: {
                where: { status: 'ACTIVE' },
                select: { gradeLevelId: true },
                take: 1,
              },
            },
          },
        },
      });
      if (parent) {
        conditions.push({ targetType: NoticeTargetType.PARENT, parentId: parent.id });
        const studentIds = parent.Student.map((s) => s.id);
        const sectionIds = parent.Student.map((s) => s.classSectionId).filter(Boolean);
        const gradeIds = parent.Student.flatMap((s) => s.StudentEnrollment.map((e) => e.gradeLevelId)).filter(Boolean);

        if (studentIds.length) conditions.push({ targetType: NoticeTargetType.STUDENT, studentId: { in: studentIds } });
        if (sectionIds.length) conditions.push({ targetType: NoticeTargetType.SECTION, sectionId: { in: sectionIds } });
        if (gradeIds.length) conditions.push({ targetType: NoticeTargetType.GRADE, gradeId: { in: gradeIds } });
      }
    } else if (userRole === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
        select: {
          ClassSection: {
            select: { id: true, gradeLevelId: true },
          },
        },
      });
      if (teacher && teacher.ClassSection.length > 0) {
        const sectionIds = teacher.ClassSection.map((s) => s.id);
        const gradeIds = teacher.ClassSection.map((s) => s.gradeLevelId).filter(Boolean);
        conditions.push({ targetType: NoticeTargetType.SECTION, sectionId: { in: sectionIds } });
        conditions.push({ targetType: NoticeTargetType.GRADE, gradeId: { in: gradeIds } });
      }
    }

    return this.prisma.notice.findMany({
      where: {
        status: NoticeStatus.PUBLISHED,
        OR: conditions,
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
      include: {
        User: { select: { email: true, role: true } },
      }
    });
  }

  async updateNoticeStatus(id: string, status: NoticeStatus): Promise<Notice> {
    const data: any = { status };
    if (status === NoticeStatus.PUBLISHED) {
      data.publishedAt = new Date();
    }
    return this.prisma.notice.update({
      where: { id },
      data,
    });
  }

  async updateNotice(id: string, userId: string, userRole: Role, data: UpdateNoticeDto): Promise<Notice> {
    const notice = await this.prisma.notice.findUnique({ where: { id } });
    if (!notice) {
      throw new NotFoundException('Notice not found.');
    }

    if (userRole === Role.TEACHER && notice.authorId !== userId) {
      throw new ForbiddenException('You can only edit announcements you created.');
    } else if (userRole !== Role.ADMIN && userRole !== Role.TEACHER) {
      throw new ForbiddenException('You do not have permission to edit announcements.');
    }

    if (userRole === Role.TEACHER && (data.targetType === NoticeTargetType.GLOBAL || data.targetType === NoticeTargetType.ROLE)) {
      throw new ForbiddenException('Teachers cannot target global or role-wide announcements.');
    }

    if (data.status && data.status !== notice.status) {
      const transitions: Record<NoticeStatus, NoticeStatus[]> = {
        DRAFT: [NoticeStatus.PUBLISHED, NoticeStatus.SCHEDULED, NoticeStatus.ARCHIVED],
        SCHEDULED: [NoticeStatus.PUBLISHED, NoticeStatus.DRAFT, NoticeStatus.ARCHIVED],
        PUBLISHED: [NoticeStatus.ARCHIVED],
        EXPIRED: [NoticeStatus.ARCHIVED, NoticeStatus.PUBLISHED],
        ARCHIVED: [NoticeStatus.DRAFT, NoticeStatus.PUBLISHED],
      };
      
      const allowed = transitions[notice.status] || [];
      if (!allowed.includes(data.status)) {
        throw new ForbiddenException(`Cannot transition announcement from ${notice.status} to ${data.status}`);
      }
    }

    const payload: any = {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    };

    if (data.status === NoticeStatus.PUBLISHED && notice.status !== NoticeStatus.PUBLISHED) {
      payload.publishedAt = new Date();
    }

    if (data.targetType) {
      if (data.targetType !== NoticeTargetType.ROLE) payload.targetRole = null;
      if (data.targetType !== NoticeTargetType.GRADE && data.targetType !== NoticeTargetType.SECTION) payload.gradeId = null;
      if (data.targetType !== NoticeTargetType.SECTION) payload.sectionId = null;
      if (data.targetType !== NoticeTargetType.STUDENT) payload.studentId = null;
      if (data.targetType !== NoticeTargetType.PARENT) payload.parentId = null;
    }

    // Strip undefined
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    return this.prisma.notice.update({
      where: { id },
      data: payload,
    });
  }

  async deleteNotice(id: string): Promise<void> {
    await this.prisma.notice.delete({ where: { id } });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledNotices() {
    const now = new Date();

    await this.prisma.notice.updateMany({
      where: {
        status: NoticeStatus.SCHEDULED,
        scheduledAt: { lte: now }
      },
      data: {
        status: NoticeStatus.PUBLISHED,
        publishedAt: now
      }
    });

    await this.prisma.notice.updateMany({
      where: {
        status: NoticeStatus.PUBLISHED,
        expiresAt: { lte: now }
      },
      data: {
        status: NoticeStatus.EXPIRED
      }
    });
  }
}
