import { api } from '../lib/api';

export interface RosterStudent {
  id: string;
  enrollmentDate: string;
  status: string;
  student: {
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
    gender: string;
    avatarUrl?: string;
  };
  attendancePercentage: number | null;
  examStatus: string;
}

export interface ClassSummary {
  name: string;
  roomNumber: string;
  capacity: number;
  gradeName: string;
  totalEnrolled: number;
}

export const getRoster = (academicYearId: string, classSectionId: string) => {
  return api.get<RosterStudent[]>(`/roster?academicYearId=${academicYearId}&classSectionId=${classSectionId}`);
};

export const getRosterSummary = (academicYearId: string, classSectionId: string) => {
  return api.get<ClassSummary>(`/roster/summary?academicYearId=${academicYearId}&classSectionId=${classSectionId}`);
};

export const enrollStudent = (data: { studentId: string; academicYearId: string; gradeLevelId: string; classSectionId: string; enrollmentDate: string; status?: string }) => {
  return api.post<any>('/roster/enroll', data);
};
