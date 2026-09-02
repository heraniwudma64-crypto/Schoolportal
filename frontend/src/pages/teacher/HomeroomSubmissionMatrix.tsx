import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Clock, Users, Download, Printer, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getAcademicYears } from '../../api/academicStructure';
import { api } from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type SubmissionStatus = {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  teacherId: string;
  isSubmitted: boolean;
  submittedAt: string | null;
  submittedCount: number;
  enrolledCount: number;
  completionPercentage: number;
};

type SubmissionMatrix = {
  classSectionName: string;
  academicYear: string;
  term: string;
  allSubmitted: boolean;
  subjects: SubmissionStatus[];
  totalSubmitted: number;
  totalSubjects: number;
};

type StudentResult = {
  studentId: string;
  admissionNo: string;
  studentName: string;
  marks: number;
  subjectId: string;
  term: string;
  status: 'DRAFT' | 'SUBMITTED';
};

// Static term definitions — we don't rely on Term DB rows because the
// SubjectResult model uses plain TERM_1…4 strings, not Term IDs.
const STATIC_TERMS = [
  { code: 'TERM_1', label: 'Term 1' },
  { code: 'TERM_2', label: 'Term 2' },
  { code: 'TERM_3', label: 'Term 3' },
  { code: 'TERM_4', label: 'Term 4' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeroomSubmissionMatrix() {
  const [matrix, setMatrix] = useState<SubmissionMatrix | null>(null);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('TERM_1');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Cache the immutable context values so term changes never re-fetch them.
  const sectionIdRef = useRef<string | null>(null);
  const yearIdRef = useRef<string | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const fetchMatrixAndResults = async (sectionId: string, yearId: string, term: string) => {
    const [matrixData, resultsData] = await Promise.all([
      api.get<SubmissionMatrix>(
        `/results/homeroom-matrix?classSectionId=${sectionId}&academicYearId=${yearId}&term=${term}`,
      ),
      api.get<StudentResult[]>(
        `/results/student-results?classSectionId=${sectionId}&academicYearId=${yearId}&term=${term}`,
      ),
    ]);
    return { matrixData, resultsData };
  };

  // ── Initial load — resolve context once, then fetch matrix ────────────────

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [context, years] = await Promise.all([
          api.get<{ assignedSection: { id: string; name: string } | null }>('/teachers/me/homeroom-context'),
          getAcademicYears(),
        ]);

        const year = years.find((y) => y.isCurrent) || years[0];
        if (!context.assignedSection || !year) {
          throw new Error('No homeroom section or academic year assigned to your account');
        }

        // Cache so term-change handler never calls these again.
        sectionIdRef.current = context.assignedSection.id;
        yearIdRef.current = year.id;

        const { matrixData, resultsData } = await fetchMatrixAndResults(
          context.assignedSection.id,
          year.id,
          selectedTerm,
        );
        setMatrix(matrixData);
        setStudentResults(resultsData);
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? err?.message ?? 'Could not load submission matrix';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // runs once

  // ── Term change — use cached sectionId + yearId ────────────────────────────

  const handleTermChange = async (newTerm: string) => {
    setSelectedTerm(newTerm);
    const sectionId = sectionIdRef.current;
    const yearId = yearIdRef.current;
    if (!sectionId || !yearId) return; // context not loaded yet

    try {
      const { matrixData, resultsData } = await fetchMatrixAndResults(sectionId, yearId, newTerm);
      setMatrix(matrixData);
      setStudentResults(resultsData);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load data for selected term');
    }
  };

  // ── Manual refresh ─────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    const sectionId = sectionIdRef.current;
    const yearId = yearIdRef.current;
    if (!sectionId || !yearId) return;

    setRefreshing(true);
    try {
      const { matrixData, resultsData } = await fetchMatrixAndResults(sectionId, yearId, selectedTerm);
      setMatrix(matrixData);
      setStudentResults(resultsData);
      toast.success('Submission matrix refreshed');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExportCsv = () => {
    if (!matrix) return;
    const headers = ['Subject', 'Teacher', 'Status', 'Submitted', 'Total', 'Completion %'];
    const rows = matrix.subjects.map((s) => [
      s.subjectName, s.teacherName,
      s.isSubmitted ? 'Submitted' : 'Pending',
      s.submittedCount, s.enrolledCount, `${s.completionPercentage}%`,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `submission-matrix-${selectedTerm}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-900 mx-auto mb-3 animate-spin" />
          <p className="text-gray-600">Loading submission matrix…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
          <div>
            <h3 className="font-bold text-red-900">Could Not Load Matrix</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!matrix) return <div className="text-gray-500 p-6">No submission data available</div>;

  const completionPct = matrix.totalSubjects
    ? Math.round((matrix.totalSubmitted / matrix.totalSubjects) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subject Results Submission Matrix</h1>
          <p className="text-sm text-gray-600 mt-1">
            {matrix.classSectionName} &bull; {matrix.academicYear} &bull;{' '}
            {STATIC_TERMS.find((t) => t.code === selectedTerm)?.label ?? selectedTerm}
          </p>
        </div>
        <div className="flex gap-2 no-print shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
            title="Refresh matrix"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* ── Term Selector ── */}
      <div className="bg-white border rounded-lg p-4 no-print">
        <label className="block text-sm font-semibold mb-2 text-gray-700">Select Term</label>
        <div className="flex gap-2 flex-wrap">
          {STATIC_TERMS.map((t) => (
            <button
              key={t.code}
              onClick={() => handleTermChange(t.code)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                selectedTerm === t.code
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overall status banner ── */}
      <div
        className={`rounded-lg p-6 text-white ${
          matrix.allSubmitted
            ? 'bg-gradient-to-r from-green-600 to-green-500'
            : 'bg-gradient-to-r from-amber-600 to-amber-500'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {matrix.allSubmitted ? 'All Submissions Complete' : 'Submissions Pending'}
            </h2>
            <p className="text-white/80 mt-1">
              {matrix.totalSubmitted} of {matrix.totalSubjects} subjects submitted ({completionPct}%)
            </p>
            {!matrix.allSubmitted && (
              <p className="text-white/70 text-sm mt-1">
                Press <strong>Refresh</strong> after subject teachers submit to update this view.
              </p>
            )}
          </div>
          <div className="text-5xl font-black text-white/20">{completionPct}%</div>
        </div>
      </div>

      {/* ── Submission table ── */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        {matrix.subjects.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-semibold">No subject assignments found for this section.</p>
            <p className="text-sm mt-1">Ask your admin to assign subjects to this class section.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 text-white text-sm">
                <th className="px-6 py-3 text-left font-bold">Subject</th>
                <th className="px-6 py-3 text-left font-bold">Teacher</th>
                <th className="px-6 py-3 text-center font-bold">Status</th>
                <th className="px-6 py-3 text-center font-bold">Submitted</th>
                <th className="px-6 py-3 text-center font-bold">Total</th>
                <th className="px-6 py-3 text-center font-bold">Completion</th>
                <th className="px-6 py-3 text-center font-bold no-print">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {matrix.subjects.map((subject, idx) => (
                <React.Fragment key={subject.subjectId}>
                  <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{subject.subjectName}</p>
                      <p className="text-xs text-gray-400">{subject.subjectCode}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm">{subject.teacherName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {subject.isSubmitted ? (
                        <span className="inline-flex items-center gap-1.5 text-green-700 font-semibold text-xs">
                          <CheckCircle2 className="w-4 h-4" /> Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-600 font-semibold text-xs">
                          <AlertCircle className="w-4 h-4" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900">
                      {subject.submittedCount}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900">
                      {subject.enrolledCount}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              subject.isSubmitted ? 'bg-green-500' : 'bg-amber-400'
                            }`}
                            style={{ width: `${subject.completionPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-10 text-right">
                          {subject.completionPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center no-print">
                      <button
                        onClick={() =>
                          setSelectedSubject(
                            selectedSubject === subject.subjectId ? null : subject.subjectId,
                          )
                        }
                        className="text-blue-700 hover:text-blue-900 text-sm font-semibold hover:underline"
                      >
                        {selectedSubject === subject.subjectId ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>

                  {/* ── Expandable student results ── */}
                  {selectedSubject === subject.subjectId && (
                    <tr className="bg-blue-50">
                      <td colSpan={7} className="px-6 py-4">
                        <h4 className="font-bold text-sm mb-3 text-gray-800">
                          Student Results — {subject.subjectName}
                        </h4>
                        {(() => {
                          const rows = studentResults.filter(
                            (r) => r.subjectId === subject.subjectId && r.term === selectedTerm,
                          );
                          return rows.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">
                              No submitted results for this subject and term yet.
                            </p>
                          ) : (
                            <div className="max-h-80 overflow-y-auto">
                              <table className="w-full text-xs border border-gray-300 rounded">
                                <thead>
                                  <tr className="bg-blue-100">
                                    <th className="border border-gray-300 p-2 text-left">Student</th>
                                    <th className="border border-gray-300 p-2 text-center">Marks</th>
                                    <th className="border border-gray-300 p-2 text-center">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((r, ri) => (
                                    <tr
                                      key={r.studentId}
                                      className={ri % 2 === 0 ? 'bg-white' : 'bg-blue-50'}
                                    >
                                      <td className="border border-gray-300 p-2">
                                        {r.admissionNo} {r.studentName}
                                      </td>
                                      <td className="border border-gray-300 p-2 text-center font-semibold">
                                        {r.marks}
                                      </td>
                                      <td className="border border-gray-300 p-2 text-center">
                                        <span
                                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                            r.status === 'SUBMITTED'
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-yellow-100 text-yellow-800'
                                          }`}
                                        >
                                          {r.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>
    </div>
  );
}
