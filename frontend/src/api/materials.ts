import { api } from '../lib/api';

export interface Material {
  id: string;
  title: string;
  category: string;
  description?: string;
  file_url: string;
  file_type?: string;
  target_role: string;
  created_at: string;
}

export const getMaterials = () => api.get<Material[]>('/materials');

export const createMaterial = (data: FormData) => 
  api.post<Material>('/materials', data);

export const updateMaterial = (id: string, data: FormData) => 
  api.patch<Material>(`/materials/${id}`, data);

export const deleteMaterial = (id: string) => 
  api.delete<{ success: boolean }>(`/materials/${id}`);

export const getMaterialDownloadUrl = (id: string) => 
  api.get<{ url: string }>(`/materials/${id}/download`);
