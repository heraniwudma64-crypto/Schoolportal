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

export interface TeachingAssignment {
  id: string;
  subjectId: string;
  classSectionId: string;
  academicYearId: string;
  Subject: { id: string; name: string; code: string };
  ClassSection: { id: string; name: string; GradeLevel?: { name: string } };
}

export const teachersApi = {
  getTeachers: async (): Promise<Teacher[]> => {
    return api.get('/teachers');
  },
  getTeachingAssignments: async (): Promise<TeachingAssignment[]> => {
    return api.get('/teachers/assignments');
  },
};
