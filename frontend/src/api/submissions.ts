import { api } from '../lib/api';

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  studentId: string;
  createdAt: string;
  updatedAt: string;
  content: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  grades: { id: string }[];
};

export const submitAssignmentWork = (assignmentId: string, file?: File, content?: string) => {
  const form = new FormData();
  if (file) form.append('file', file);
  if (content?.trim()) form.append('content', content.trim());
  return api.post<AssignmentSubmission>(`/students/my-assignments/${assignmentId}/submission`, form);
};
