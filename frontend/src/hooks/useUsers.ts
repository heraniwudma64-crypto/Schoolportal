import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, downloadFile } from '../lib/api';
import {
  ClassSection,
  CreateUserPayload,
  ManagedUser,
  PaginatedUsers,
  ParentLookupOption,
  StudentLookupItem,
  ParentLinkedChildrenResponse,
  UpdateUserPayload,
  UserStats,
} from '../types/users';

export interface UserFilters {
  search: string;
  role: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

const DEFAULT_FILTERS: UserFilters = {
  search: '',
  role: '',
  status: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 15,
};

function buildQuery(filters: UserFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.role) params.set('role', filters.role);
  if (filters.status) params.set('status', filters.status);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  return params.toString();
}

export function useUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [stats, setStats] = useState<UserStats | null>(null);
  const [classSections, setClassSections] = useState<ClassSection[]>([]);
  const [parentsList, setParentsList] = useState<ParentLookupOption[]>([]);
  const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search to avoid hammering the API on every keystroke
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (f: UserFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.get<PaginatedUsers>(`/users?${buildQuery(f)}`);
      setUsers(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const s = await api.get<UserStats>('/users/stats');
      setStats(s);
    } catch {
      // stats failure is non-critical
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const fetchClassSections = useCallback(async (academicYearId?: string) => {
    try {
      const url = academicYearId
        ? `/users/class-sections?academicYearId=${encodeURIComponent(academicYearId)}`
        : '/users/class-sections';
      const sections = await api.get<ClassSection[]>(url);
      setClassSections(sections);
      return sections;
    } catch {
      // non-critical
      return [];
    }
  }, []);

  const fetchParentsList = useCallback(async () => {
    if (parentsList.length > 0) return parentsList;
    try {
      const list = await api.get<ParentLookupOption[]>('/users/parents-list');
      setParentsList(list);
      return list;
    } catch {
      // non-critical
      return [];
    }
  }, [parentsList.length]);

  // Initial load: fetch users list and summary stats only
  useEffect(() => {
    void fetchUsers(filters);
    void fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when non-search filters change immediately
  const applyFilters = useCallback(
    (updates: Partial<UserFilters>) => {
      const newFilters = { ...filters, ...updates, page: updates.page ?? 1 };
      setFilters(newFilters);

      if ('search' in updates) {
        // Debounce search input
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
          void fetchUsers(newFilters);
        }, 350);
      } else {
        void fetchUsers(newFilters);
      }
    },
    [filters, fetchUsers],
  );

  const refresh = useCallback(() => {
    void fetchUsers(filters);
    void fetchStats();
    if (parentsList.length > 0) void fetchParentsList();
  }, [filters, fetchUsers, fetchStats, fetchParentsList, parentsList.length]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createUser = useCallback(
    async (payload: CreateUserPayload): Promise<ManagedUser> => {
      const created = await api.post<ManagedUser>('/users', payload);
      await refresh();
      return created;
    },
    [refresh],
  );

  const updateUser = useCallback(
    async (id: string, payload: UpdateUserPayload): Promise<ManagedUser> => {
      const updated = await api.patch<ManagedUser>(`/users/${id}`, payload);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      void fetchStats();
      return updated;
    },
    [fetchStats],
  );

  const activateUser = useCallback(
    async (id: string): Promise<ManagedUser> => {
      const updated = await api.patch<ManagedUser>(`/users/${id}/activate`);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      void fetchStats();
      return updated;
    },
    [fetchStats],
  );

  const deactivateUser = useCallback(
    async (id: string): Promise<ManagedUser> => {
      const updated = await api.patch<ManagedUser>(`/users/${id}/deactivate`);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      void fetchStats();
      return updated;
    },
    [fetchStats],
  );

  const resetPassword = useCallback(async (id: string, newPassword: string) => {
    return api.post<{ message: string }>(`/users/${id}/reset-password`, { newPassword });
  }, []);

  const deleteUser = useCallback(
    async (id: string) => {
      const result = await api.delete<{ message: string }>(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      void fetchStats();
      return result;
    },
    [fetchStats],
  );

  const getStudentsLookup = useCallback(async () => {
    return api.get<StudentLookupItem[]>('/users/students-lookup');
  }, []);

  const getParentChildren = useCallback(async (parentId: string) => {
    return api.get<ParentLinkedChildrenResponse>(`/users/parents/${parentId}/children`);
  }, []);

  const linkParentChildren = useCallback(
    async (parentId: string, studentIds: string[]) => {
      const result = await api.put<ParentLinkedChildrenResponse>(
        `/users/parents/${parentId}/children`,
        { studentIds },
      );
      await refresh();
      return result;
    },
    [refresh],
  );

  const exportUsers = useCallback(
    async (mode: 'all' | 'filtered') => {
      setIsExporting(true);
      try {
        let queryStr = '';
        if (mode === 'filtered') {
          const params = new URLSearchParams();
          if (filters.search) params.set('search', filters.search);
          if (filters.role) params.set('role', filters.role);
          if (filters.status) params.set('status', filters.status);
          if (filters.sortBy) params.set('sortBy', filters.sortBy);
          if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
          queryStr = params.toString();
        }
        const path = queryStr ? `/users/export?${queryStr}` : '/users/export';
        const defaultFilename = `users-${mode}-${new Date().toISOString().split('T')[0]}.csv`;
        await downloadFile(path, defaultFilename);
      } finally {
        setIsExporting(false);
      }
    },
    [filters],
  );

  return {
    users,
    meta,
    stats,
    classSections,
    parentsList,
    filters,
    isLoading,
    isStatsLoading,
    isExporting,
    error,
    applyFilters,
    refresh,
    fetchStats,
    fetchClassSections,
    fetchParentsList,
    createUser,
    updateUser,
    activateUser,
    deactivateUser,
    resetPassword,
    deleteUser,
    getStudentsLookup,
    getParentChildren,
    linkParentChildren,
    exportUsers,
  };
}
