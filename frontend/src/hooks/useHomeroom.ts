import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// ─── Shared Homeroom Types ───────────────────────────────────────────────────

export interface HomeroomContextData {
  teacherId: string;
  isHomeroomTeacher: boolean;
  assignedSection: {
    id: string;
    name: string;
    grade?: string;
    studentCount?: number;
  } | null;
}

export interface SubjectSubmission {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherId: string;
  teacherName: string;
  submittedCount: number;
  enrolledCount: number;
  isSubmitted: boolean;
  completionPercentage: number;
  submittedAt: string | null;
}

export interface SubmissionMatrixData {
  allSubmitted: boolean;
  subjects: SubjectSubmission[];
  matrix: SubjectSubmission[];
  totalSubmitted: number;
  totalSubjects: number;
  classSectionName: string;
  academicYear: string;
  term: string;
}

export interface StudentResultData {
  studentId: string;
  admissionNo: string;
  studentName: string;
  marks: number;
  subjectId: string;
  term: string;
  status: string;
}

export interface SubjectScore {
  subjectId: string;
  subject: string;
  code: string;
  term1: number | null;
  term2: number | null;
  term3: number | null;
  term4: number | null;
  sem1Avg: number | null;
  sem2Avg: number | null;
  yearlyAverage: number | null;
}

export interface RosterStudent {
  studentId: string;
  admissionNo: string;
  studentName: string;
  sex: string;
  subjectScores: SubjectScore[];
  sum: number;
  average: number | null;
  rank: number;
  absentDays: number;
  conduct: string | null;
}

export interface ConsolidatedRosterData {
  section: { id?: string; name: string; grade?: string; homeroomTeacher: string | null };
  subjects: Array<{ id: string; name: string; code: string }>;
  students: RosterStudent[];
}

export interface ReportCardData {
  studentId: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  academicYear: string;
  gradeLevel: string;
  promotedToGrade?: string;
  classSectionName: string;
  homeroomTeacher?: string;
  subjectResults: Array<{
    subjectName: string;
    term1: number | null;
    term2: number | null;
    sem1Avg: number | null;
    term3: number | null;
    term4: number | null;
    sem2Avg: number | null;
    yearlyAvg: number | null;
  }>;
  overallTotal: number;
  overallAverage: number;
  overallRank: number;
  absentDays: number;
  conduct: string;
  behaviourAssessment: {
    academicPotential: string;
    uniform: string;
    timeManagement: string;
    harmfulActions: string;
    responsibilities: string;
    clubActivities: string;
    classworkHomework: string;
    flexibility: string;
    hardWork: string;
    positiveThinking: string;
    obeyingRules: string;
    interpersonalCommunication: string;
  };
  homeroomRemarksSem1?: string;
  homeroomRemarksSem2?: string;
}

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const HOMEROOM_KEYS = {
  context: (userId?: string) => ['teachers', 'me', 'homeroom-context', userId] as const,
  submissionMatrix: (sectionId?: string, yearId?: string, term?: string) =>
    ['results', 'homeroom-matrix', sectionId, yearId, term] as const,
  studentResults: (sectionId?: string, yearId?: string, term?: string) =>
    ['results', 'student-results', sectionId, yearId, term] as const,
  consolidatedRoster: (sectionId?: string, yearId?: string) =>
    ['roster', 'consolidated', sectionId, yearId] as const,
  compiledReportCards: (sectionId?: string, yearId?: string) =>
    ['report-cards', 'compiled', sectionId, yearId] as const,
};

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useHomeroomContext() {
  const { user } = useAuth();
  return useQuery<HomeroomContextData>({
    queryKey: HOMEROOM_KEYS.context(user?.id),
    queryFn: () => api.get<HomeroomContextData>('/teachers/me/homeroom-context'),
    enabled: user?.role === 'teacher' && !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });
}

export function useHomeroomSubmissionMatrix(sectionId?: string | null, yearId?: string | null, term: string = 'TERM_1') {
  return useQuery<SubmissionMatrixData>({
    queryKey: HOMEROOM_KEYS.submissionMatrix(sectionId || '', yearId || '', term),
    queryFn: () =>
      api.get<SubmissionMatrixData>(
        `/results/homeroom-matrix?classSectionId=${sectionId}&academicYearId=${yearId}&term=${term}`,
      ),
    enabled: !!sectionId && !!yearId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHomeroomStudentResults(sectionId?: string | null, yearId?: string | null, term: string = 'TERM_1') {
  return useQuery<StudentResultData[]>({
    queryKey: HOMEROOM_KEYS.studentResults(sectionId || '', yearId || '', term),
    queryFn: () =>
      api.get<StudentResultData[]>(
        `/results/student-results?classSectionId=${sectionId}&academicYearId=${yearId}&term=${term}`,
      ),
    enabled: !!sectionId && !!yearId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useConsolidatedRoster(sectionId?: string | null, yearId?: string | null) {
  return useQuery<ConsolidatedRosterData>({
    queryKey: HOMEROOM_KEYS.consolidatedRoster(sectionId || '', yearId || ''),
    queryFn: () =>
      api.get<ConsolidatedRosterData>(
        `/roster/consolidated?academicYearId=${yearId}&classSectionId=${sectionId}`,
      ),
    enabled: !!sectionId && !!yearId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompiledReportCards(sectionId?: string | null, yearId?: string | null) {
  return useQuery<ReportCardData[]>({
    queryKey: HOMEROOM_KEYS.compiledReportCards(sectionId || '', yearId || ''),
    queryFn: () =>
      api.get<ReportCardData[]>(
        `/report-cards/compiled?classSectionId=${sectionId}&academicYearId=${yearId}`,
      ),
    enabled: !!sectionId && !!yearId,
    staleTime: 5 * 60 * 1000,
  });
}
