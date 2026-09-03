import { api } from '../lib/api';

export type VideoStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface EducationalVideo {
  id: string;
  title: string;
  description?: string | null;
  youtubeUrl: string;
  youtubeVideoId: string;
  thumbnailUrl?: string | null;
  subjectId: string;
  classSectionId?: string | null;
  teacherId: string;
  status: VideoStatus;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  Subject?: { id: string; name: string; code?: string } | null;
  ClassSection?: { id: string; name: string } | null;
  Teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    staffId?: string | null;
    User?: { email?: string | null };
  } | null;
}

export interface VideoFilterOptions {
  subjects: Array<{ id: string; name: string; code?: string }>;
  classSections: Array<{ id: string; name: string }>;
}

export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.trim().match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
  );
  return match ? match[1] : null;
}

// ── Teacher APIs ─────────────────────────────────────────────────────────────

export const getTeacherVideos = () =>
  api.get<EducationalVideo[]>('/videos/teacher');

export const createVideo = (data: {
  title: string;
  description?: string;
  youtubeUrl: string;
  subjectId: string;
  classSectionId?: string;
  isDraft?: boolean;
}) => api.post<EducationalVideo>('/videos', data);

export const updateVideo = (
  id: string,
  data: {
    title?: string;
    description?: string;
    youtubeUrl?: string;
    subjectId?: string;
    classSectionId?: string;
    status?: 'DRAFT' | 'PENDING_APPROVAL';
  },
) => api.patch<EducationalVideo>(`/videos/${id}`, data);

export const submitVideoForReview = (id: string) =>
  api.post<EducationalVideo>(`/videos/${id}/submit`);

export const deleteVideo = (id: string) =>
  api.delete<{ success: boolean; message: string }>(`/videos/${id}`);

// ── Admin APIs ───────────────────────────────────────────────────────────────

export const getAdminVideos = (status?: string) => {
  const query = status && status !== 'ALL' ? `?status=${status}` : '';
  return api.get<EducationalVideo[]>(`/videos/admin/all${query}`);
};

export const reviewVideo = (
  id: string,
  data: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string },
) => api.patch<EducationalVideo>(`/videos/${id}/review`, data);

// ── Student APIs ─────────────────────────────────────────────────────────────

export const getStudentVideos = (subjectId?: string) => {
  const query = subjectId && subjectId !== 'ALL' ? `?subjectId=${subjectId}` : '';
  return api.get<EducationalVideo[]>(`/videos/student${query}`);
};

// ── Shared Filter Options ────────────────────────────────────────────────────

export const getVideoFilterOptions = () =>
  api.get<VideoFilterOptions>('/videos/filter-options');
