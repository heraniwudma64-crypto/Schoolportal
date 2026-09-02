import { api } from '../lib/api';

export interface ParentProfileResponse {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string | null;
  occupation: string | null;
  relationship: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    loginId: string;
    email: string | null;
    phoneNumber: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
  };
}

export interface ParentChildSummary {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: string | null;
  dob: string | null;
  address: string | null;
  emergencyContact: string | null;
  status: string;
  avatarUrl: string | null;
  classSection: {
    id: string;
    name: string;
    roomNumber: string | null;
    gradeLevel: string | null;
  } | null;
  currentEnrollment: {
    id: string;
    academicYear: string | null;
    gradeLevel: string | null;
    classSection: string | null;
  } | null;
}

export interface ChildAttendanceRecord {
  id: string;
  date: string;
  period: number | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks: string | null;
  classSection: string | null;
}

export interface ChildAttendanceResponse {
  student: {
    id: string;
    admissionNo: string;
    fullName: string;
    avatarUrl: string | null;
    classSection: string | null;
  };
  summary: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendancePercentage: number;
  };
  records: ChildAttendanceRecord[];
}

export interface ChildGradeRecord {
  id: string;
  subject: string;
  quarter: string;
  mid: number;
  assignment: number;
  quiz: number;
  classwork: number;
  final: number;
  score: number;
  gradeLetter: string;
  createdAt: string;
}

export interface ChildSubjectResultRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  term: string;   // "TERM_1" … "TERM_4"
  marks: number;
  status: string;
  updatedAt: string;
}

export interface ChildExamAttemptRecord {
  id: string;
  examId: string;
  examTitle: string;
  subject: string;
  marksObtained: number;
  grade: string | null;
  remarks: string | null;
  createdAt: string;
}

export interface ChildExamResultRecord {
  id: string;
  examId: string;
  examTitle: string;
  subject: string;
  score: number;
  totalMarks: number;
  marksObtained: number;
  submittedAt: string;
}

export interface ChildResultsResponse {
  student: {
    id: string;
    admissionNo: string;
    fullName: string;
    avatarUrl: string | null;
    classSection: string | null;
  };
  overallAverage: number;
  totalRecords: number;
  grades: ChildGradeRecord[];
  subjectResults: ChildSubjectResultRecord[];
  examResults?: ChildExamResultRecord[];
  examAttempts: ChildExamAttemptRecord[];
}

export interface ChildReportCardResponse {
  student: {
    id: string;
    admissionNo: string;
    fullName: string;
    avatarUrl: string | null;
    classSection: string | null;
  };
  availableTerms: Array<{
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
  }>;
  selectedTermId: string | null;
  reportCard: {
    student: {
      admissionNo: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
    academicInfo: {
      academicYear: string;
      grade: string;
      section: string;
      term: string;
    };
    subjects: Array<{
      name: string;
      code: string;
      score: number;
      maxScore: number;
      percentage: number;
      gradeLetter: string;
    }>;
    overall: {
      percentage: number;
      gradeLetter: string;
    };
    attendance: {
      present: number;
      absent: number;
      total: number;
      percentage: number;
    };
  } | null;
}

export interface ChildAssignmentRecord {
  id: string;
  title: string;
  subject: string | null;
  description: string | null;
  instructions: string | null;
  dueDate: string;
  attachmentUrl: string | null;
  teacherName: string | null;
  classSection: string;
  submissionStatus: string;
  submittedAt: string | null;
}

export interface ChildAssignmentsResponse {
  student: {
    id: string;
    admissionNo: string;
    fullName: string;
    avatarUrl: string | null;
    classSection: string | null;
  };
  totalAssignments: number;
  submittedCount: number;
  pendingCount: number;
  assignments: ChildAssignmentRecord[];
}

export interface ChildScheduleSlot {
  id: string;
  dayOfWeek: number | string;
  startTime: string;
  endTime: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  roomNumber: string;
}

export interface ChildScheduleResponse {
  student: {
    id: string;
    admissionNo: string;
    fullName: string;
    avatarUrl: string | null;
    classSection: string | null;
  };
  schedule: ChildScheduleSlot[];
}

export const getProfile = () => api.get<ParentProfileResponse>('/parents/me');

export const getChildren = () => api.get<ParentChildSummary[]>('/parents/me/children');

export const getChildAttendance = (studentId: string) =>
  api.get<ChildAttendanceResponse>(`/parents/me/children/${studentId}/attendance`);

export const getChildResults = (studentId: string) =>
  api.get<ChildResultsResponse>(`/parents/me/children/${studentId}/results`);

export const getChildReportCard = (studentId: string, termId?: string) =>
  api.get<ChildReportCardResponse>(
    `/parents/me/children/${studentId}/report-card${termId ? `?termId=${encodeURIComponent(termId)}` : ''}`,
  );

export const getChildAssignments = (studentId: string) =>
  api.get<ChildAssignmentsResponse>(`/parents/me/children/${studentId}/assignments`);

export const getChildSchedule = (studentId: string) =>
  api.get<ChildScheduleResponse>(`/parents/me/children/${studentId}/schedule`);
