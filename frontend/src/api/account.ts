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
  phoneNumber: string | null;
  Student?: {
    admissionNo: string;
    firstName: string;
    lastName: string;
    institutionId: string | null;
    institutionName: string | null;
    fatherName: string | null;
    grandfatherName: string | null;
    admissionType: string | null;
    gender: string | null;
    dob: string | null;
    nationality: string | null;
    hasDisability: boolean;
    disabilityType: string | null;
    familyKebele: string | null;
    locationType: string | null;
    fatherEducationLevel: string | null;
    motherEducationLevel: string | null;
    economicStatus: string | null;
    guardianFullName: string | null;
    familyHeadGender: string | null;
    guardianEmail: string | null;
    guardianPhone: string | null;
    nationalId: string | null;
    residenceRegion: string | null;
    residenceZone: string | null;
    residenceWoreda: string | null;
    birthRegion: string | null;
    birthZone: string | null;
    birthWoreda: string | null;
    parentStatus: string | null;
    ClassSection?: { id: string; name: string } | null;
  } | null;
}

export const getMyAccount = () => api.get<AccountProfile>('/account/me');

export const updateMyAccount = (data: { name?: string; loginId?: string; email?: string; student?: Record<string, unknown> }) =>
  api.patch<AccountProfile>('/account/me', data);

export const updateMyPassword = (data: { currentPassword?: string; newPassword?: string }) => 
  api.patch<{ success: boolean }>('/account/me/password', data);

export const uploadMyAvatar = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<AccountProfile>('/account/me/avatar', formData);
};

export const removeMyAvatar = () => api.delete<AccountProfile>('/account/me/avatar');
