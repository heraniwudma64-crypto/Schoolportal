import React, { useEffect, useRef, useState } from 'react';
import {
  RefreshCw, Printer, Download, CheckCircle2, AlertCircle,
  Clock, Send, BadgeCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAcademicYears } from '../../api/academicStructure';
import { api } from '../../lib/api';
import { submitReportCardsToAdmin, AdminSubmitReceipt } from '../../api/adminReports';

// ─── Types ────────────────────────────────────────────────────────────────────

type SubjectSubmission = {
  subjectId?: string;
  subjectName: string;
  teacherName: string;
  isSubmitted: boolean;
};

type SubmissionMatrix = {
  allSubmitted: boolean;
  matrix?: SubjectSubmission[];
  subjects?: SubjectSubmission[];
  totalSubmitted?: number;
  totalSubjects?: number;
};

type RosterStudent = {
  studentId: string;
  admissionNo: string;
  studentName: string;
  average: number | null;
  rank: number;
};

type ConsolidatedRoster = {
  students: RosterStudent[];
};

const STATIC_TERMS = [
  { code: 'TERM_1', label: 'Term 1' },
  { code: 'TERM_2', label: 'Term 2' },
  { code: 'TERM_3', label: 'Term 3' },
  { code: 'TERM_4', label: 'Term 4' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeroomReportCards() {
  const [matrix, setMatrix] = useState<SubmissionMatrix | null>(null);
  const [preparedRoster, setPreparedRoster] = useState<ConsolidatedRoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitReceipt, setSubmitReceipt] = useState<AdminSubmitReceipt | null>(null);
  const [error, setError] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('TERM_1');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  // Cached immutable context — never re-fetched after initial load.
  const sectionIdRef = useRef<string | null>(null);
  const yearIdRef = useRef<string | null>(null);

  // ── Data fetcher ──────────────────────────────────────────────────────────

  const fetchData = async (sectionId: string, yearId: string, term: string) => {
    const [submissionMatrix, roster] = await Promise.all([
      api.get<SubmissionMatrix>(
        `/results/homeroom-matrix?classSectionId=${sectionId}&academicYearId=${yearId}&term=${term}`,
      ),
      api.get<ConsolidatedRoster>(
        `/roster/consolidated?academicYearId=${yearId}&classSectionId=${sectionId}`,
      ),
    ]);
    return { submissionMatrix, roster };
  };

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [context, years] = await Promise.all([
          api.get<{ assignedSection: { id: string } | null }>('/teachers/me/homeroom-context'),
          getAcademicYears(),
        ]);
        const year = years.find((y) => y.isCurrent) || years[0];
        if (!context.assignedSection || !year) {
          throw new Error('No homeroom section or academic year assigned to your account');
        }
        sectionIdRef.current = context.assignedSection.id;
        yearIdRef.current = year.id;

        const { submissionMatrix, roster } = await fetchData(
          context.assignedSection.id,
          year.id,
          selectedTerm,
        );
        setMatrix(submissionMatrix);
        setPreparedRoster(roster);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? err?.message ?? 'Could not load report card data');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Term change ───────────────────────────────────────────────────────────

  const handleTermChange = async (term: string) => {
    setSelectedTerm(term);
    const sectionId = sectionIdRef.current;
    const yearId = yearIdRef.current;
    if (!sectionId || !yearId) return;

    try {
      const newMatrix = await api.get<SubmissionMatrix>(
        `/results/homeroom-matrix?classSectionId=${sectionId}&academicYearId=${yearId}&term=${term}`,
      );
      setMatrix(newMatrix);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load data for selected term');
    }
  };

  // ── Manual refresh ────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    const sectionId = sectionIdRef.current;
    const yearId = yearIdRef.current;
    if (!sectionId || !yearId) return;

    setRefreshing(true);
    try {
      const { submissionMatrix, roster } = await fetchData(sectionId, yearId, selectedTerm);
      setMatrix(submissionMatrix);
      setPreparedRoster(roster);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  // ── Submit to Admin ───────────────────────────────────────────────────────

  const handleSubmitToAdmin = async () => {
    const sectionId = sectionIdRef.current;
    const yearId = yearIdRef.current;
    if (!sectionId || !yearId) return;

    // Surface the exact subjects still pending so the teacher knows what to fix
    const pendingSubjects = (matrix?.matrix ?? matrix?.subjects ?? [])
      .filter((s) => !s.isSubmitted)
      .map((s) => s.subjectName);

    if (pendingSubjects.length > 0) {
      toast.error(
        `Cannot submit — the following subject${pendingSubjects.length > 1 ? 's are' : ' is'} still pending: ${pendingSubjects.join(', ')}`,
      );
      return;
    }

    const confirmed = window.confirm(
      'Send finalized report cards to the admin portal for review?\n\n' +
      'Once submitted, the admin will be able to see and approve your section\'s report cards.',
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const receipt = await submitReportCardsToAdmin(sectionId, yearId);
      setSubmitReceipt(receipt);
      toast.success(receipt.message);
    } catch (err: any) {
      const msg: string =
        err?.response?.data?.message ?? err?.message ?? 'Failed to submit to admin';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Print / Export ────────────────────────────────────────────────────────

  const students = preparedRoster?.students ?? [];
  const selected = students.filter((s) => selectedStudents.includes(s.studentId));

  const printCards = () => {
    if (selected.length === 0) return window.alert('Select at least one student to print');
    setIsPrinting(true);
    window.setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 0);
  };

  const exportCsv = () => {
    if (selected.length === 0) return window.alert('Select at least one student to export');
    const rows = selected.map((s) => [
      s.admissionNo,
      s.studentName,
      s.average ?? '',
      s.rank || '',
    ]);
    const csv = [['Admission No', 'Student', 'Yearly Average', 'Rank'], ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `report-cards-${selectedTerm}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Render states ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="w-10 h-10 text-blue-900 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500">Checking subject submissions…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-900">Error</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 text-sm font-semibold text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const subjectRows: SubjectSubmission[] = matrix?.matrix ?? matrix?.subjects ?? [];
  const visibleStudents = isPrinting ? selected : students;
  const canSubmit = matrix?.allSubmitted === true && !submitReceipt;

  return (
    <div className="max-w-4xl space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Card Preparation</h1>
          <p className="text-sm text-gray-500">
            Compile cards from results submitted by subject teachers.
          </p>
        </div>
        <div className="flex gap-2 print:hidden shrink-0 flex-wrap justify-end">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            onClick={printCards}
            className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" /> Print / PDF
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 bg-blue-900 text-white rounded-lg px-3 py-2 text-sm font-semibold hover:bg-blue-800"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          {/* ── Submit to Admin ── */}
          <button
            onClick={handleSubmitToAdmin}
            disabled={!canSubmit || submitting}
            title={
              submitReceipt
                ? 'Already submitted to admin'
                : !matrix?.allSubmitted
                ? 'All subjects must be submitted before sending to admin'
                : 'Send finalized report cards to the admin portal'
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm ${
              submitReceipt
                ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                : canSubmit
                ? 'bg-green-700 text-white hover:bg-green-800 shadow-green-700/20'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
            }`}
          >
            {submitReceipt ? (
              <><BadgeCheck className="w-4 h-4" /> Submitted to Admin</>
            ) : submitting ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting…</>
            ) : (
              <><Send className="w-4 h-4" /> Submit to Admin</>
            )}
          </button>
        </div>
      </div>

      {/* ── Submission receipt banner ── */}
      {submitReceipt && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 print:hidden">
          <BadgeCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-green-900">Successfully submitted to admin portal</p>
            <p className="text-sm text-green-800 mt-0.5">{submitReceipt.message}</p>
            <p className="text-xs text-green-600 mt-1">
              Submitted by <strong>{submitReceipt.submittedBy}</strong> on{' '}
              {new Date(submitReceipt.submittedAt).toLocaleString()} &bull;{' '}
              {submitReceipt.enrolledStudents} students &bull;{' '}
              {submitReceipt.submittedSubjects} subjects
            </p>
          </div>
        </div>
      )}

      {/* ── Term selector ── */}
      <div className="bg-white border rounded-xl p-4 print:hidden">
        <p className="text-sm font-semibold text-gray-700 mb-2">Select Term</p>
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

      {/* ── Submission status panel ── */}
      <div className="bg-white border rounded-xl p-6 print:hidden">
        {matrix?.allSubmitted ? (
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="font-semibold">
              All subjects submitted for{' '}
              {STATIC_TERMS.find((t) => t.code === selectedTerm)?.label ?? selectedTerm}.
              {!submitReceipt && ' Report cards are ready to submit to admin.'}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 text-amber-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                Waiting for subject teachers to submit results for{' '}
                {STATIC_TERMS.find((t) => t.code === selectedTerm)?.label ?? selectedTerm}.
              </p>
              <p className="text-sm mt-0.5 text-amber-600">
                Press <strong>Refresh</strong> after teachers submit to update this view.
                The <strong>Submit to Admin</strong> button will unlock once all subjects are complete.
              </p>
            </div>
          </div>
        )}

        {subjectRows.length > 0 && (
          <div className="mt-4 divide-y border rounded-lg overflow-hidden">
            {subjectRows.map((item) => (
              <div
                key={item.subjectName}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="text-gray-800">
                  {item.subjectName}{' '}
                  <span className="text-gray-400 font-normal">({item.teacherName})</span>
                </span>
                {item.isSubmitted ? (
                  <span className="flex items-center gap-1 text-green-700 font-semibold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 font-semibold text-xs">
                    <AlertCircle className="w-3.5 h-3.5" /> Pending
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Student list ── */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-5 border-b print:hidden">
          <h2 className="font-bold text-gray-900">Prepared Student Cards</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Select cards for batch printing or CSV export.
          </p>
          {students.length > 0 && (
            <label className="mt-3 flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedStudents.length === students.length && students.length > 0}
                onChange={(e) =>
                  setSelectedStudents(e.target.checked ? students.map((s) => s.studentId) : [])
                }
              />
              Select all ({students.length} students)
            </label>
          )}
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="font-semibold">No students enrolled in this section.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 print:hidden" />
                <th className="p-3 text-left font-semibold text-gray-700">Student</th>
                <th className="p-3 text-center font-semibold text-gray-700">Yearly Average</th>
                <th className="p-3 text-center font-semibold text-gray-700">Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibleStudents.map((student) => (
                <tr key={student.studentId} className="hover:bg-gray-50">
                  <td className="p-3 text-center print:hidden">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.studentId)}
                      onChange={(e) =>
                        setSelectedStudents((prev) =>
                          e.target.checked
                            ? [...prev, student.studentId]
                            : prev.filter((id) => id !== student.studentId),
                        )
                      }
                    />
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-gray-900">{student.studentName}</span>
                    <span className="text-xs text-gray-400 ml-2">{student.admissionNo}</span>
                  </td>
                  <td className="p-3 text-center">
                    {student.average != null ? (
                      <span
                        className={`font-bold ${
                          student.average >= 80
                            ? 'text-green-700'
                            : student.average >= 60
                            ? 'text-blue-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {student.average.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center font-semibold text-gray-700">
                    {student.rank > 0 ? student.rank : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
