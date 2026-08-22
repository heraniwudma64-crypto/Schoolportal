import { api } from '../lib/api';

export interface AccountProfile {
  id: string;
  loginId: string;
  email: string | null;
  name: string | null;
  role: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export const getMyAccount = () => api.get<AccountProfile>('/account/me');

export const updateMyAccount = (data: { name?: string; loginId?: string; email?: string }) => 
  api.patch<AccountProfile>('/account/me', data);

export const updateMyPassword = (data: { currentPassword?: string; newPassword?: string }) => 
  api.patch<{ success: boolean }>('/account/me/password', data);

export const uploadMyAvatar = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<AccountProfile>('/account/me/avatar', formData);
};

export const removeMyAvatar = () => api.delete<AccountProfile>('/account/me/avatar');
