import { useQuery } from '@tanstack/react-query';
import { teachersApi, Teacher } from '../api/teachers';

export const TEACHER_KEYS = {
  all: ['teachers'] as const,
  list: ['teachers', 'list'] as const,
  homeroomContext: (userId?: string) => ['teachers', 'me', 'homeroom-context', userId] as const,
  dashboard: ['teachers', 'dashboard'] as const,
};

export function useTeachers() {
  return useQuery<Teacher[]>({
    queryKey: TEACHER_KEYS.list,
    queryFn: async () => {
      const res = await teachersApi.getTeachers();
      return Array.isArray(res) ? res : (res as any)?.teachers || (res as any)?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
