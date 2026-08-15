import { api } from '../lib/api';

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  targetType: 'GLOBAL' | 'ROLE' | 'GRADE' | 'SECTION' | 'STUDENT' | 'PARENT';
  targetRole?: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED';
  publishedAt?: string;
  scheduledAt?: string;
  expiresAt?: string;
  authorId: string;
  gradeId?: string;
  sectionId?: string;
  studentId?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  User?: { email: string; role: string };
  GradeLevel?: { name: string };
  ClassSection?: { name: string };
}

export const createNotice = (data: Partial<Notice>) => api.post<Notice>('/notices', data);
export const getAdminNotices = () => api.get<Notice[]>('/notices/admin');
export const getUserNotices = () => api.get<Notice[]>('/notices');
export const updateNotice = (id: string, data: Partial<Notice>) => api.patch<Notice>(`/notices/${id}`, data);
export const deleteNotice = (id: string) => api.delete<void>(`/notices/${id}`);
