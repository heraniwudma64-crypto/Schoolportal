import { api } from '../lib/api';

export interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
}

export interface ClassSection {
  id: string;
  name: string;
  gradeLevelId: string;
  displayName?: string;
  GradeLevel?: { name: string };
}

export interface GradeLevel {
  id: string;
  name: string;
  gradeNumber: number | null;
  status: string;
  ClassSection: ClassSection[];
  StudentEnrollment?: any[];
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  type: string;
}

export interface GradeSubject {
  id: string;
  academicYearId: string | null;
  gradeLevelId: string;
  subjectId: string;
  Subject: Subject;
  GradeLevel: GradeLevel;
}

export const getAcademicYears = () => api.get<AcademicYear[]>('/academic-structure/years');
export const createAcademicYear = (data: { label: string; startDate: string; endDate: string }) => api.post<AcademicYear>('/academic-structure/years', data);
export const activateAcademicYear = (id: string) => api.post<AcademicYear>(`/academic-structure/years/${id}/activate`);

export const getGradeLevels = () => api.get<GradeLevel[]>('/academic-structure/grades');
export const createGradeLevel = (data: { name: string; gradeNumber?: number; description?: string }) => api.post<GradeLevel>('/academic-structure/grades', data);

export const createSection = (data: { gradeLevelId: string; name: string }) => api.post<ClassSection>('/academic-structure/sections', data);

export const getSubjects = () => api.get<Subject[]>('/academic-structure/subjects');
export const createSubject = (data: { name: string; code: string; type?: string; description?: string }) => api.post<Subject>('/academic-structure/subjects', data);

export const getGradeSubjects = () => api.get<GradeSubject[]>('/academic-structure/grade-subjects');
export const assignSubjectToGrade = (gradeLevelId: string, data: { subjectId: string; academicYearId?: string }) => api.post<GradeSubject>(`/academic-structure/grades/${gradeLevelId}/subjects`, data);
export const unassignSubjectFromGrade = (id: string) => api.delete<void>(`/academic-structure/grade-subjects/${id}`);

export const getEligibleStudents = (academicYearId: string) => api.get<any[]>(`/academic-structure/promotions/eligible/${academicYearId}`);
export const promoteStudents = (data: any) => api.post<any>('/academic-structure/promotions', data);
