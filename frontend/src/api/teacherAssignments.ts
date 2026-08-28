import { api } from '../lib/api';

export interface TeacherAssignment {
  id: string;
  classSectionId: string;
  grade: string;
  section: string;
  teacher: {
    id: string;
    name: string;
    staffId?: string;
  } | null;
  academicYearId: string;
}

export interface SubjectTeacherAssignment extends TeacherAssignment {
  subject: {
    id: string;
    name: string;
    code: string;
  };
  academicYear: {
    id: string;
    year: string;
  };
}

export const teacherAssignmentsApi = {
  getHomeRoomAssignments: async (academicYearId?: string): Promise<TeacherAssignment[]> => {
    const qs = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return api.get(`/teacher-assignments/homeroom${qs}`);
  },

  assignHomeRoomTeacher: async (classSectionId: string, teacherId: string | null) => {
    return api.post('/teacher-assignments/homeroom', { classSectionId, teacherId });
  },

  getSubjectAssignments: async (academicYearId?: string): Promise<SubjectTeacherAssignment[]> => {
    const qs = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return api.get(`/teacher-assignments/subject${qs}`);
  },

  assignSubjectTeacher: async (payload: { classSectionId: string; subjectId: string; teacherId: string; academicYearId: string }) => {
    return api.post('/teacher-assignments/subject', payload);
  },

  removeSubjectTeacher: async (id: string) => {
    return api.delete(`/teacher-assignments/subject/${id}`);
  }
};
