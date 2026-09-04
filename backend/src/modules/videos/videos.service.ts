import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Role, VideoStatus, VideoSourceType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { ReviewVideoDto } from './dto/review-video.dto';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
  'video/x-matroska',
  'video/mpeg',
];

export const MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function extractYouTubeVideoId(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
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

function formatVideoResponse(video: any) {
  if (!video) return video;
  return {
    ...video,
    fileSize:
      video.fileSize !== null && video.fileSize !== undefined
        ? Number(video.fileSize)
        : null,
  };
}

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  private supabase = createClient(
    process.env.SUPABASE_URL || this.extractSupabaseUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      'fake-key-for-now',
    { auth: { persistSession: false } },
  );

  private extractSupabaseUrl(): string {
    const dbUrl = process.env.DATABASE_URL || '';
    const userMatch = dbUrl.match(/postgres\.(.*?):/);
    if (userMatch) {
      return `https://${userMatch[1]}.supabase.co`;
    }
    return '';
  }

  private extractStoragePathFromUrl(videoUrl?: string | null): string | null {
    if (!videoUrl) return null;
    const match = videoUrl.match(/materials\/(educational-videos\/.*)$/);
    if (match) return match[1];
    const directMatch = videoUrl.match(/(educational-videos\/.*)$/);
    if (directMatch) return directMatch[1];
    return null;
  }

  // ── 1. Teacher: Create Video (Draft or Submit for Review) ───────────────────
  async create(
    dto: CreateVideoDto,
    teacherUserId: string,
    file?: Express.Multer.File,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        subjectSections: {
          select: { classSectionId: true, subjectId: true },
        },
      },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher profile not found for current user');
    }

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

      // Check teacher assignment authorization
      if (
        teacher.subjectSections &&
        teacher.subjectSections.length > 0
      ) {
        const isAssigned = teacher.subjectSections.some(
          (s) => s.classSectionId === dto.classSectionId,
        );
        if (!isAssigned) {
          throw new ForbiddenException(
            'You can only submit video lessons for class sections you are assigned to teach.',
          );
        }
      }
    }

    const hasYoutube = Boolean(dto.youtubeUrl && dto.youtubeUrl.trim().length > 0);
    const hasFile = Boolean(file);

    // Mutual exclusivity check
    if (hasYoutube && hasFile) {
      throw new BadRequestException(
        'Cannot provide both a YouTube URL and a video file upload. Please choose only one video source.',
      );
    }
    if (!hasYoutube && !hasFile) {
      throw new BadRequestException(
        'Please provide either a valid YouTube URL or upload a video file.',
      );
    }

    let sourceType: VideoSourceType = VideoSourceType.YOUTUBE;
    let youtubeUrl: string | null = null;
    let youtubeVideoId: string | null = null;
    let thumbnailUrl: string | null = null;
    let videoUrl: string | null = null;
    let fileSize: bigint | null = null;
    let mimeType: string | null = null;
    let uploadedStoragePath: string | null = null;

    if (hasYoutube) {
      sourceType = VideoSourceType.YOUTUBE;
      youtubeUrl = dto.youtubeUrl!.trim();
      youtubeVideoId = extractYouTubeVideoId(youtubeUrl);
      thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
    } else if (hasFile && file) {
      // Validate MIME type
      if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
        throw new BadRequestException(
          `Unsupported video format (${file.mimetype}). Supported formats: MP4, WebM, MOV.`,
        );
      }
      // Validate file size
      if (file.size > MAX_VIDEO_FILE_SIZE) {
        throw new BadRequestException(
          'Video file exceeds the maximum allowed size of 50MB.',
        );
      }

      const sanitizedName = file.originalname
        .replace(/[^a-zA-Z0-9.\-_]/g, '')
        .toLowerCase();
      uploadedStoragePath = `educational-videos/${teacher.id}/${crypto.randomUUID()}-${sanitizedName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('materials')
        .upload(uploadedStoragePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage Upload Error:', uploadError);
        throw new InternalServerErrorException(
          `Failed to upload video to storage: ${uploadError.message || 'Storage error'}`,
        );
      }

      const { data: pubData } = this.supabase.storage
        .from('materials')
        .getPublicUrl(uploadedStoragePath);

      sourceType = VideoSourceType.UPLOAD;
      videoUrl = pubData.publicUrl;
      fileSize = BigInt(file.size);
      mimeType = file.mimetype;
    }

    const isDraft = dto.isDraft === true || dto.isDraft === 'true';
    const status: VideoStatus = isDraft
      ? VideoStatus.DRAFT
      : VideoStatus.PENDING_APPROVAL;

    try {
      const created = await this.prisma.educationalVideo.create({
        data: {
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          sourceType,
          youtubeUrl,
          youtubeVideoId,
          thumbnailUrl,
          videoUrl,
          fileSize,
          mimeType,
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

      return formatVideoResponse(created);
    } catch (dbError: any) {
      // Rollback uploaded storage file on DB error
      if (uploadedStoragePath) {
        await this.supabase.storage
          .from('materials')
          .remove([uploadedStoragePath]);
      }
      console.error('Educational video create error:', dbError);
      throw new InternalServerErrorException(
        `Failed to save video: ${dbError.message || dbError}`,
      );
    }
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

    const videos = await this.prisma.educationalVideo.findMany({
      where: { teacherId: teacher.id },
      orderBy: { createdAt: 'desc' },
      include: {
        Subject: { select: { id: true, name: true, code: true } },
        ClassSection: { select: { id: true, name: true } },
      },
    });

    return videos.map(formatVideoResponse);
  }

  // ── 3. Teacher: Update a Video (Drafts & Rejected can be edited) ────────────
  async update(
    id: string,
    dto: UpdateVideoDto,
    teacherUserId: string,
    file?: Express.Multer.File,
  ) {
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
      throw new ForbiddenException(
        'You can only update your own video submissions',
      );
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.description !== undefined)
      updateData.description = dto.description?.trim() || null;
    if (dto.subjectId !== undefined) updateData.subjectId = dto.subjectId;
    if (dto.classSectionId !== undefined)
      updateData.classSectionId = dto.classSectionId || null;

    let newStoragePath: string | null = null;
    const oldStoragePath = this.extractStoragePathFromUrl(video.videoUrl);

    if (file) {
      // Validate uploaded file
      if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
        throw new BadRequestException(
          `Unsupported video format (${file.mimetype}). Supported formats: MP4, WebM, MOV.`,
        );
      }
      if (file.size > MAX_VIDEO_FILE_SIZE) {
        throw new BadRequestException(
          'Video file exceeds the maximum allowed size of 50MB.',
        );
      }

      const sanitizedName = file.originalname
        .replace(/[^a-zA-Z0-9.\-_]/g, '')
        .toLowerCase();
      newStoragePath = `educational-videos/${teacher.id}/${crypto.randomUUID()}-${sanitizedName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('materials')
        .upload(newStoragePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        throw new InternalServerErrorException(
          `Failed to upload video: ${uploadError.message || 'Storage error'}`,
        );
      }

      const { data: pubData } = this.supabase.storage
        .from('materials')
        .getPublicUrl(newStoragePath);

      updateData.sourceType = VideoSourceType.UPLOAD;
      updateData.videoUrl = pubData.publicUrl;
      updateData.fileSize = BigInt(file.size);
      updateData.mimeType = file.mimetype;
      updateData.youtubeUrl = null;
      updateData.youtubeVideoId = null;
      updateData.thumbnailUrl = null;

      // Clean up old storage file if existed
      if (oldStoragePath) {
        await this.supabase.storage.from('materials').remove([oldStoragePath]);
      }
    } else if (dto.youtubeUrl && dto.youtubeUrl.trim().length > 0) {
      const yId = extractYouTubeVideoId(dto.youtubeUrl);
      updateData.sourceType = VideoSourceType.YOUTUBE;
      updateData.youtubeUrl = dto.youtubeUrl.trim();
      updateData.youtubeVideoId = yId;
      updateData.thumbnailUrl = `https://img.youtube.com/vi/${yId}/hqdefault.jpg`;
      updateData.videoUrl = null;
      updateData.fileSize = null;
      updateData.mimeType = null;

      // Clean up old storage file if existed
      if (oldStoragePath) {
        await this.supabase.storage.from('materials').remove([oldStoragePath]);
      }
    }

    const isDraft = dto.isDraft === true || dto.isDraft === 'true';
    if (dto.status || dto.isDraft !== undefined) {
      const targetStatus: VideoStatus = isDraft
        ? VideoStatus.DRAFT
        : (dto.status as VideoStatus) || VideoStatus.PENDING_APPROVAL;
      updateData.status = targetStatus;
      if (targetStatus === VideoStatus.PENDING_APPROVAL) {
        updateData.submittedAt = new Date();
        updateData.rejectionReason = null;
      }
    }

    try {
      const updated = await this.prisma.educationalVideo.update({
        where: { id },
        data: updateData,
        include: {
          Subject: { select: { id: true, name: true, code: true } },
          ClassSection: { select: { id: true, name: true } },
        },
      });

      return formatVideoResponse(updated);
    } catch (err: any) {
      if (newStoragePath) {
        await this.supabase.storage.from('materials').remove([newStoragePath]);
      }
      throw new InternalServerErrorException(
        `Failed to update video: ${err.message || err}`,
      );
    }
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

    const updated = await this.prisma.educationalVideo.update({
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

    return formatVideoResponse(updated);
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
        throw new ForbiddenException(
          'You cannot delete another teacher’s video',
        );
      }
    }

    // Clean up Supabase storage file if it's an uploaded video
    const storagePath = this.extractStoragePathFromUrl(video.videoUrl);
    if (storagePath) {
      await this.supabase.storage.from('materials').remove([storagePath]);
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

    const videos = await this.prisma.educationalVideo.findMany({
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

    return videos.map(formatVideoResponse);
  }

  // ── 7. Admin: Review Video (Approve or Reject) ──────────────────────────────
  async reviewVideo(id: string, dto: ReviewVideoDto, adminUserId: string) {
    const video = await this.prisma.educationalVideo.findUnique({
      where: { id },
    });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const updated = await this.prisma.educationalVideo.update({
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

    return formatVideoResponse(updated);
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

    const videos = await this.prisma.educationalVideo.findMany({
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

    return videos.map(formatVideoResponse);
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

    let teacherSubjects: Array<{ id: string; name: string; code?: string | null }> = allSubjects;
    let teacherSections: Array<{ id: string; name: string }> = allClasses;

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
        const subMap = new Map<string, { id: string; name: string; code?: string | null }>();
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

