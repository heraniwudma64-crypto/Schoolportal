import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Role, VideoStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { ReviewVideoDto } from './dto/review-video.dto';

export function extractYouTubeVideoId(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new BadRequestException('YouTube URL is required');
  }
  const cleanUrl = url.trim();
  const match = cleanUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
  );
  if (!match || !match[1]) {
    throw new BadRequestException(
      'Invalid YouTube URL. Please provide a standard YouTube video link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)',
    );
  }
  return match[1];
}

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 1. Teacher: Create Video (Draft or Submit for Review) ───────────────────
  async create(dto: CreateVideoDto, teacherUserId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher profile not found for current user');
    }

    const youtubeVideoId = extractYouTubeVideoId(dto.youtubeUrl);
    const thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;

    // Verify subject exists
    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
      select: { id: true, name: true },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Verify section if supplied
    if (dto.classSectionId) {
      const section = await this.prisma.classSection.findUnique({
        where: { id: dto.classSectionId },
        select: { id: true },
      });
      if (!section) {
        throw new NotFoundException('Target class section not found');
      }
    }

    const isDraft = dto.isDraft ?? false;
    const status: VideoStatus = isDraft
      ? VideoStatus.DRAFT
      : VideoStatus.PENDING_APPROVAL;

    return this.prisma.educationalVideo.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        youtubeUrl: dto.youtubeUrl.trim(),
        youtubeVideoId,
        thumbnailUrl,
        subjectId: dto.subjectId,
        classSectionId: dto.classSectionId || null,
        teacherId: teacher.id,
        status,
        submittedAt: isDraft ? null : new Date(),
      },
      include: {
        Subject: { select: { id: true, name: true, code: true } },
        ClassSection: { select: { id: true, name: true } },
      },
    });
  }

  // ── 2. Teacher: List All Videos by Current Teacher ─────────────────────────
  async findAllForTeacher(teacherUserId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });
    if (!teacher) {
      return [];
    }

    return this.prisma.educationalVideo.findMany({
      where: { teacherId: teacher.id },
      orderBy: { createdAt: 'desc' },
      include: {
        Subject: { select: { id: true, name: true, code: true } },
        ClassSection: { select: { id: true, name: true } },
      },
    });
  }

  // ── 3. Teacher: Update a Video (Drafts & Rejected can be edited) ────────────
  async update(id: string, dto: UpdateVideoDto, teacherUserId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    const video = await this.prisma.educationalVideo.findUnique({
      where: { id },
    });
    if (!video) {
      throw new NotFoundException('Video submission not found');
    }
    if (video.teacherId !== teacher.id) {
      throw new ForbiddenException('You can only update your own video submissions');
    }

    let youtubeVideoId = video.youtubeVideoId;
    let thumbnailUrl = video.thumbnailUrl;
    if (dto.youtubeUrl && dto.youtubeUrl !== video.youtubeUrl) {
      youtubeVideoId = extractYouTubeVideoId(dto.youtubeUrl);
      thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.description !== undefined) updateData.description = dto.description?.trim() || null;
    if (dto.youtubeUrl !== undefined) {
      updateData.youtubeUrl = dto.youtubeUrl.trim();
      updateData.youtubeVideoId = youtubeVideoId;
      updateData.thumbnailUrl = thumbnailUrl;
    }
    if (dto.subjectId !== undefined) updateData.subjectId = dto.subjectId;
    if (dto.classSectionId !== undefined) updateData.classSectionId = dto.classSectionId || null;

    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === VideoStatus.PENDING_APPROVAL) {
        updateData.submittedAt = new Date();
        updateData.rejectionReason = null;
      }
    }

    return this.prisma.educationalVideo.update({
      where: { id },
      data: updateData,
      include: {
        Subject: { select: { id: true, name: true, code: true } },
        ClassSection: { select: { id: true, name: true } },
      },
    });
  }

  // ── 4. Teacher: Submit a Draft/Rejected Video for Review ────────────────────
  async submitForReview(id: string, teacherUserId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    const video = await this.prisma.educationalVideo.findUnique({
      where: { id },
    });
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    if (video.teacherId !== teacher.id) {
      throw new ForbiddenException('You can only submit your own video');
    }

    return this.prisma.educationalVideo.update({
      where: { id },
      data: {
        status: VideoStatus.PENDING_APPROVAL,
        submittedAt: new Date(),
        rejectionReason: null,
      },
      include: {
        Subject: { select: { id: true, name: true, code: true } },
        ClassSection: { select: { id: true, name: true } },
      },
    });
  }

  // ── 5. Teacher / Admin: Delete Video ───────────────────────────────────────
  async delete(id: string, userId: string, role: Role) {
    const video = await this.prisma.educationalVideo.findUnique({
      where: { id },
    });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!teacher || video.teacherId !== teacher.id) {
        throw new ForbiddenException('You cannot delete another teacher’s video');
      }
    }

    await this.prisma.educationalVideo.delete({ where: { id } });
    return { success: true, message: 'Video deleted successfully' };
  }

  // ── 6. Admin: List All Submissions (with status filter) ─────────────────────
  async findAllForAdmin(statusFilter?: string) {
    const where: any = {};
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter as VideoStatus;
    }

    return this.prisma.educationalVideo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        Subject: { select: { id: true, name: true, code: true } },
        ClassSection: { select: { id: true, name: true } },
        Teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffId: true,
            User: { select: { email: true } },
          },
        },
      },
    });
  }

  // ── 7. Admin: Review Video (Approve or Reject) ──────────────────────────────
  async reviewVideo(id: string, dto: ReviewVideoDto, adminUserId: string) {
    const video = await this.prisma.educationalVideo.findUnique({
      where: { id },
    });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return this.prisma.educationalVideo.update({
      where: { id },
      data: {
        status: dto.status as VideoStatus,
        rejectionReason:
          dto.status === 'REJECTED'
            ? dto.rejectionReason?.trim() || 'Needs revision before release.'
            : null,
        reviewedAt: new Date(),
        reviewedById: adminUserId,
      },
      include: {
        Subject: { select: { id: true, name: true, code: true } },
        ClassSection: { select: { id: true, name: true } },
        Teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffId: true,
          },
        },
      },
    });
  }

  // ── 8. Student: Fetch Approved Videos with Automatic Class Section & Subject Filtering ─
  async findApprovedForStudent(studentUserId: string, subjectId?: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
      select: {
        id: true,
        classSectionId: true,
        ClassSection: { select: { id: true, name: true } },
      },
    });

    if (!student) {
      throw new NotFoundException('Student record not found');
    }

    const where: any = {
      status: VideoStatus.APPROVED,
    };

    // Automatic targeted class section filter:
    // Only return videos specifically targeted to this student's class section or global (classSectionId is null)
    if (student.classSectionId) {
      where.OR = [
        { classSectionId: student.classSectionId },
        { classSectionId: null },
      ];
    } else {
      where.classSectionId = null;
    }

    // Optional subject filter
    if (subjectId && subjectId !== 'ALL') {
      where.subjectId = subjectId;
    }

    return this.prisma.educationalVideo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        Subject: { select: { id: true, name: true, code: true } },
        ClassSection: { select: { id: true, name: true } },
        Teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // ── 9. Filter Options: Subjects and Class Sections ──────────────────────────
  async getFilterOptions(userId: string, role: Role) {
    const [allSubjects, allClasses] = await Promise.all([
      this.prisma.subject.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.classSection.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    let teacherSubjects = allSubjects;
    let teacherSections = allClasses;

    if (role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
        select: {
          id: true,
          subjectSections: {
            select: {
              Subject: { select: { id: true, name: true, code: true } },
              ClassSection: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (teacher?.subjectSections && teacher.subjectSections.length > 0) {
        // Distinct subjects taught by this teacher
        const subMap = new Map<string, { id: string; name: string; code: string }>();
        const secMap = new Map<string, { id: string; name: string }>();

        for (const row of teacher.subjectSections) {
          if (row.Subject) subMap.set(row.Subject.id, row.Subject);
          if (row.ClassSection) secMap.set(row.ClassSection.id, row.ClassSection);
        }

        if (subMap.size > 0) teacherSubjects = Array.from(subMap.values());
        if (secMap.size > 0) teacherSections = Array.from(secMap.values());
      }
    }

    return {
      subjects: teacherSubjects,
      classSections: teacherSections,
    };
  }
}
