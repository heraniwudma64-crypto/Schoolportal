import { api } from '../lib/api';

export interface Teacher {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  staffId?: string;
  User?: {
    email: string;
  };
}

export const teachersApi = {
  getTeachers: async (): Promise<Teacher[]> => {
    return api.get('/teachers');
  }
};
