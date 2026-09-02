import React from 'react';
import { Download, Printer, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAcademicYears } from '../../hooks/useAcademicStructure';
import {
  useHomeroomContext,
  useConsolidatedRoster,
  ConsolidatedRosterData,
} from '../../hooks/useHomeroom';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined): string {
  return v != null ? v.toFixed(1) : '—';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeroomRosterRedesigned() {
  // 1. Shared Homeroom Context & Academic Years (from Cache)
  const { data: homeroomContext, isLoading: contextLoading, error: contextError } = useHomeroomContext();
  const { data: years = [], isLoading: yearsLoading } = useAcademicYears();

  const currentYear = years.find((y) => y.isCurrent) || years[0];
  const sectionId = homeroomContext?.assignedSection?.id;
  const yearId = currentYear?.id;

  // 2. Consolidated Roster Query
  const {
    data,
    isLoading: rosterLoading,
    isFetching: refreshing,
    error: rosterError,
    refetch,
  } = useConsolidatedRoster(sectionId, yearId);

  const loading = contextLoading || yearsLoading || (rosterLoading && !data);
  const error =
    (contextError as any)?.response?.data?.message ||
    (contextError as any)?.message ||
    (!contextLoading && !homeroomContext?.assignedSection ? 'No homeroom section assigned to your account' : '') ||
    (rosterError as any)?.response?.data?.message ||
    (rosterError as any)?.message ||
    '';

  // ── Refresh ───────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Roster refreshed');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Refresh failed');
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExportCsv = () => {
    if (!data) return;

    const subjectCols = data.subjects.flatMap((s) => [
      `${s.code} 1st`, `${s.code} 2nd`, `${s.code} 3rd`, `${s.code} 4th`,
      `${s.code} Ave1`, `${s.code} Ave2`, `${s.code} Year`,
    ]);
    const headers = ['No', 'Admission No', 'Name', 'Sex', ...subjectCols, 'Sum', 'Avg', 'Rank', 'Abs D', 'Conduct'];

    const rows = data.students.map((student, idx) => {
      const scoreCols = student.subjectScores.flatMap((sc) => [
        sc.term1 ?? '', sc.term2 ?? '', sc.term3 ?? '', sc.term4 ?? '',
        sc.sem1Avg != null ? sc.sem1Avg.toFixed(1) : '',
        sc.sem2Avg != null ? sc.sem2Avg.toFixed(1) : '',
        sc.yearlyAverage != null ? sc.yearlyAverage.toFixed(1) : '',
      ]);
      return [
        idx + 1, student.admissionNo, student.studentName, student.sex,
        ...scoreCols,
        student.sum, student.average != null ? student.average.toFixed(1) : '',
        student.rank || '', student.absentDays, student.conduct || '',
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${data.section.name}-Consolidated-Roster.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Render states ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="w-10 h-10 text-blue-900 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500">Loading consolidated roster…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-900">Could Not Load Roster</p>
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

  if (!data) return <div className="text-gray-500 p-6">No roster data available</div>;

  // Determine whether any subject results have been submitted yet
  const hasSubmittedResults = data.students.some((s) =>
    s.subjectScores.some(
      (sc) =>
        sc.term1 != null || sc.term2 != null || sc.term3 != null || sc.term4 != null,
    ),
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Consolidated Roster</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data.section.grade ? `${data.section.grade} ` : ''}
            {data.section.name}
            {data.section.homeroomTeacher && ` • Homeroom: ${data.section.homeroomTeacher}`}
          </p>
        </div>
        <div className="flex gap-2 no-print shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
            title="Reload submitted results"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* ── Pending-results notice ── */}
      {!hasSubmittedResults && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 no-print">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">No submitted results yet</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Subject teachers haven't sent any results to this homeroom yet. The marks columns will
              populate automatically once they submit. Press <strong>Refresh</strong> to check for
              updates.
            </p>
          </div>
        </div>
      )}

      {/* ── Empty students ── */}
      {data.students.length === 0 ? (
        <div className="bg-white border rounded-xl p-10 text-center text-gray-400">
          <p className="font-semibold text-gray-500">No students enrolled in this section.</p>
          <p className="text-sm mt-1">
            Enroll students from the Admin panel, then refresh this page.
          </p>
        </div>
      ) : (
        // ── Main table ──
        <div className="bg-white border rounded-xl overflow-auto shadow-sm">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              {/* Row 1 — subject names spanning 7 cols each */}
              <tr className="bg-gray-900 text-white">
                <th className="border border-gray-700 p-2 text-left" rowSpan={3}>No</th>
                <th className="border border-gray-700 p-2 text-left" rowSpan={3} style={{ minWidth: 160 }}>
                  Name
                </th>
                <th className="border border-gray-700 p-2 text-center" rowSpan={3}>Sex</th>
                {data.subjects.map((s) => (
                  <th
                    key={s.id}
                    className="border border-gray-700 p-2 text-center bg-gray-800"
                    colSpan={7}
                    style={{ minWidth: 140 }}
                  >
                    {s.name}
                  </th>
                ))}
                <th className="border border-gray-700 p-2 text-center" rowSpan={3}>Sum</th>
                <th className="border border-gray-700 p-2 text-center" rowSpan={3}>Avg</th>
                <th className="border border-gray-700 p-2 text-center" rowSpan={3}>Rank</th>
                <th className="border border-gray-700 p-2 text-center" rowSpan={3}>Abs D</th>
                <th className="border border-gray-700 p-2 text-center" rowSpan={3}>Conduct</th>
              </tr>

              {/* Row 2 — quarter/semester sub-headers */}
              <tr className="bg-gray-700 text-white">
                {data.subjects.map((s) => (
                  <React.Fragment key={`${s.id}-r2`}>
                    <th className="border border-gray-600 p-2 text-center">1st</th>
                    <th className="border border-gray-600 p-2 text-center">2nd</th>
                    <th className="border border-gray-600 p-2 text-center">3rd</th>
                    <th className="border border-gray-600 p-2 text-center">4th</th>
                    <th className="border border-gray-600 p-2 text-center bg-blue-800">Ave1</th>
                    <th className="border border-gray-600 p-2 text-center bg-blue-800">Ave2</th>
                    <th className="border border-gray-600 p-2 text-center bg-green-800">Year</th>
                  </React.Fragment>
                ))}
              </tr>

              {/* Row 3 — subject codes */}
              <tr className="bg-gray-600 text-white">
                {data.subjects.map((s) =>
                  Array.from({ length: 7 }, (_, i) => (
                    <th key={`${s.id}-c${i}`} className="border border-gray-600 p-1 text-center">
                      {s.code}
                    </th>
                  )),
                )}
              </tr>
            </thead>

            <tbody>
              {data.students.map((student, rowIdx) => (
                <tr
                  key={student.studentId}
                  className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="border border-gray-200 p-2 text-center font-semibold">
                    {rowIdx + 1}
                  </td>
                  <td className="border border-gray-200 p-2 text-left font-semibold whitespace-nowrap">
                    <span className="text-gray-400 mr-1">{student.admissionNo}</span>
                    {student.studentName}
                  </td>
                  <td className="border border-gray-200 p-2 text-center">{student.sex || '—'}</td>

                  {student.subjectScores.map((sc) => (
                    <React.Fragment key={sc.subjectId}>
                      <td className="border border-gray-200 p-2 text-center">{sc.term1 ?? '—'}</td>
                      <td className="border border-gray-200 p-2 text-center">{sc.term2 ?? '—'}</td>
                      <td className="border border-gray-200 p-2 text-center">{sc.term3 ?? '—'}</td>
                      <td className="border border-gray-200 p-2 text-center">{sc.term4 ?? '—'}</td>
                      <td className="border border-gray-200 p-2 text-center bg-blue-50 font-semibold">
                        {fmt(sc.sem1Avg)}
                      </td>
                      <td className="border border-gray-200 p-2 text-center bg-blue-50 font-semibold">
                        {fmt(sc.sem2Avg)}
                      </td>
                      <td className="border border-gray-200 p-2 text-center bg-green-50 font-bold">
                        {fmt(sc.yearlyAverage)}
                      </td>
                    </React.Fragment>
                  ))}

                  <td className="border border-gray-200 p-2 text-center font-semibold">
                    {student.sum}
                  </td>
                  <td className="border border-gray-200 p-2 text-center font-semibold">
                    {fmt(student.average)}
                  </td>
                  <td className="border border-gray-200 p-2 text-center font-bold">
                    {student.rank || '—'}
                  </td>
                  <td className="border border-gray-200 p-2 text-center">{student.absentDays}</td>
                  <td className="border border-gray-200 p-2 text-center font-semibold">
                    {student.conduct || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          table { font-size: 8px; }
          @page { size: A4 landscape; margin: 0.5cm; }
        }
      `}</style>
    </div>
  );
}
