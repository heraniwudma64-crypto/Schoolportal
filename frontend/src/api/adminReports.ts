import { api } from '../lib/api';

// ─── Types matching backend ReportsService responses ─────────────────────────

export type SectionSubmissionStatus = 'complete' | 'partial' | 'none';

export interface AdminSectionSummary {
  id: string;
  name: string;
  displayName: string;
  gradeLevelName: string;
  academicYearId: string | null;
  homeroomTeacher: string | null;
  enrolledCount: number;
  totalSubjects: number;
  submittedSubjects: number;
  submissionStatus: SectionSubmissionStatus;
  /** UI-friendly label: 'Submitted' | 'Pending Review' | 'Draft' */
  status: string;
}

export interface AdminReportCardStudent {
  studentId: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: number;
  academicYear: string;
  gradeLevel: string;
  classSectionName: string;
  homeroomTeacher: string;
  subjectResults: Array<{
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    term1: number | null;
    term2: number | null;
    term3: number | null;
    term4: number | null;
    sem1Avg: number | null;
    sem2Avg: number | null;
    yearlyAvg: number | null;
  }>;
  overallTotal: number;
  overallAverage: number;
  overallRank: number;
  absentDays: number;
  conduct: string;
}

export interface AdminRosterEntry {
  rank: number;
  studentId: string;
  studentName: string;
  subjectScores: Record<string, number>;
  totalMarks: number;
  average: number;
}

export interface AdminSubmitReceipt {
  success: boolean;
  submittedAt: string;
  submittedBy: string;
  classSectionId: string;
  classSectionName: string;
  academicYear: string;
  type: 'roster' | 'report-cards' | 'both';
  enrolledStudents: number;
  submittedSubjects: number;
  message: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const getAdminSections = (academicYearId?: string) =>
  api.get<AdminSectionSummary[]>(
    `/admin/reports/sections${academicYearId ? `?academicYearId=${academicYearId}` : ''}`,
  );

export const getAdminSectionReportCards = (classSectionId: string, academicYearId: string) =>
  api.get<AdminReportCardStudent[]>(
    `/admin/reports/sections/${classSectionId}/report-cards?academicYearId=${academicYearId}`,
  );

export const getAdminSectionRoster = (classSectionId: string, academicYearId: string, term = 'TERM_1') =>
  api.get<AdminRosterEntry[]>(
    `/admin/reports/sections/${classSectionId}/roster?academicYearId=${academicYearId}&term=${term}`,
  );

/**
 * Homeroom teacher dispatches their section's report cards to admin.
 * Backend validates homeroom ownership + all subjects submitted.
 */
export const submitReportCardsToAdmin = (
  classSectionId: string,
  academicYearId: string,
) =>
  api.post<AdminSubmitReceipt>('/admin/reports/homeroom/submit-to-admin', {
    classSectionId,
    academicYearId,
    type: 'report-cards',
  });

/**
 * Homeroom teacher dispatches their section's consolidated roster to admin.
 * Backend validates homeroom ownership + all subjects submitted.
 */
export const submitRosterToAdmin = (
  classSectionId: string,
  academicYearId: string,
) =>
  api.post<AdminSubmitReceipt>('/admin/reports/homeroom/submit-to-admin', {
    classSectionId,
    academicYearId,
    type: 'roster',
  });

/**
 * Dispatch both roster and report cards in a single call.
 */
export const submitBothToAdmin = (
  classSectionId: string,
  academicYearId: string,
) =>
  api.post<AdminSubmitReceipt>('/admin/reports/homeroom/submit-to-admin', {
    classSectionId,
    academicYearId,
    type: 'both',
  });
