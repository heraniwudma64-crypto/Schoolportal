import { api } from '../lib/api';

export interface StudentAttendanceRecord {
  id: string;
  date: string;
  period: number | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks: string | null;
  ClassSection: { name: string };
  User: { Teacher: { firstName: string; lastName: string } | null };
}

export const getMyAttendance = () =>
  api.get<StudentAttendanceRecord[]>('/students/me/attendance');

export interface StudentCourse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string | null;
  grade: string;
}

export const getMyCourses = () => api.get<StudentCourse[]>('/students/me/courses');

export interface StudentScheduleEntry {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  ClassSection: { name: string; roomNumber: string | null };
  Subject: { name: string };
  Teacher: { firstName: string; lastName: string };
}

export const getMySchedule = () => api.get<StudentScheduleEntry[]>('/students/me/schedule');

export interface StudentResult {
  id: string;
  marksObtained: number;
  grade: string | null;
  remarks: string | null;
  Exam: {
    title: string;
    totalMarks: number;
    examDate: string;
    type: string;
    Subject: { name: string };
    Term: { name: string } | null;
  };
}

export const getMyResults = () => api.get<StudentResult[]>('/students/me/results');
