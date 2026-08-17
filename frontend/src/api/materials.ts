import { api } from '../lib/api';

export interface Material {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType?: string;
  targetRole?: string;
  category?: string;
  createdAt: string;
}

export const getMaterials = () => api.get<Material[]>('/materials');

export const createMaterial = (data: FormData) => 
  api.post<Material>('/materials', data);

export const updateMaterial = (id: string, data: FormData) => 
  api.patch<Material>(`/materials/${id}`, data);

export const deleteMaterial = (id: string) => 
  api.delete<{ success: boolean }>(`/materials/${id}`);
