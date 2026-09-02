import React, { useState } from 'react';
import {
  Search, RefreshCw, FileCheck, CheckCircle, XCircle, Eye,
  Users, TrendingUp, Download, Printer, AlertCircle, Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useOutletContext } from 'react-router-dom';
import { getAcademicYears } from '../../api/academicStructure';
import {
  getAdminSections,
  getAdminSectionReportCards,
  AdminSectionSummary,
  AdminReportCardStudent,
} from '../../api/adminReports';
import { useQuery } from '@tanstack/react-query';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined) {
  return v != null ? v.toFixed(1) : '—';
}

function gradeBand(avg: number) {
  if (avg >= 90) return 'A';
  if (avg >= 80) return 'B';
  if (avg >= 70) return 'C';
  if (avg >= 60) return 'D';
  return 'F';
}

const STATUS_STYLES: Record<string, string> = {
  Submitted:      'bg-green-100 text-green-700',
  'Pending Review': 'bg-amber-100 text-amber-700',
  Draft:          'bg-gray-100 text-gray-500',
  Approved:       'bg-green-100 text-green-700',
  Rejected:       'bg-red-100 text-red-700',
};

// ─── Component ────────────────────────────────────────────────────────────────

const AdminReportCards = () => {
  const { searchQuery: globalSearch = '' } = useOutletContext<{ searchQuery: string }>();
  const [localSearch, setLocalSearch] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedSection, setSelectedSection] = useState<AdminSectionSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [printStudentId, setPrintStudentId] = useState<string | null>(null);

  // ── Academic years dropdown ──────────────────────────────────────────────
  const { data: years = [] } = useQuery({
    queryKey: ['academicYears'],
    queryFn: getAcademicYears,
    onSuccess: (data: any[]) => {
      if (!academicYearId && data.length) {
        const cur = data.find((y) => y.isCurrent) ?? data[0];
        setAcademicYearId(cur.id);
      }
    },
  } as any);

  // ── Sections list ────────────────────────────────────────────────────────
  const {
    data: sections = [],
    isLoading: sectionsLoading,
    isError: sectionsError,
    refetch: refetchSections,
  } = useQuery({
    queryKey: ['adminSections', academicYearId],
    queryFn: () => getAdminSections(academicYearId || undefined),
    enabled: !!academicYearId,
  });

  // ── Report cards for the selected section ───────────────────────────────
  const {
    data: reportCards = [],
    isLoading: cardsLoading,
    isError: cardsError,
  } = useQuery({
    queryKey: ['adminReportCards', selectedSection?.id, academicYearId],
    queryFn: () => getAdminSectionReportCards(selectedSection!.id, academicYearId),
    enabled: !!selectedSection && !!academicYearId && modalOpen,
  });

  // ── Filtering ────────────────────────────────────────────────────────────
  const search = (localSearch || globalSearch).toLowerCase();
  const filtered = sections.filter((s: AdminSectionSummary) => {
    const matchSearch =
      s.displayName.toLowerCase().includes(search) ||
      (s.homeroomTeacher ?? '').toLowerCase().includes(search);
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openModal = (section: AdminSectionSummary) => {
    setSelectedSection(section);
    setPrintStudentId(null);
    setModalOpen(true);
  };

  const exportCsv = () => {
    if (!reportCards.length || !selectedSection) return;
    const subjects = reportCards[0]?.subjectResults ?? [];
    const subjectCols = subjects.flatMap((s: any) => [
      `${s.subjectName} T1`, `${s.subjectName} T2`,
      `${s.subjectName} T3`, `${s.subjectName} T4`,
      `${s.subjectName} Sem1`, `${s.subjectName} Sem2`,
      `${s.subjectName} Year`,
    ]);
    const headers = ['Admission No', 'Name', 'Gender', ...subjectCols, 'Total', 'Average', 'Rank', 'Abs Days'];
    const rows = reportCards.map((c: AdminReportCardStudent) => [
      c.admissionNo,
      `${c.firstName} ${c.lastName}`,
      c.gender,
      ...c.subjectResults.flatMap((s) => [
        s.term1 ?? '', s.term2 ?? '', s.term3 ?? '', s.term4 ?? '',
        s.sem1Avg != null ? s.sem1Avg.toFixed(1) : '',
        s.sem2Avg != null ? s.sem2Avg.toFixed(1) : '',
        s.yearlyAvg != null ? s.yearlyAvg.toFixed(1) : '',
      ]),
      c.overallTotal, c.overallAverage, c.overallRank, c.absentDays,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${selectedSection.displayName}-report-cards.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Report Card Review</h2>
          <p className="text-sm text-gray-500">
            Review compiled report cards submitted by Homeroom Teachers.
          </p>
        </div>
        <button
          onClick={() => refetchSections()}
          className="p-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-900 hover:bg-blue-50 transition-all self-start"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">
            Academic Year
          </label>
          <select
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-900/20 transition-all"
          >
            <option value="">Select year</option>
            {years.map((y: any) => (
              <option key={y.id} value={y.id}>{y.year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Section or teacher…"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-900/20 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-900/20 transition-all"
          >
            {['All', 'Submitted', 'Pending Review', 'Draft'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        {sectionsLoading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading sections…
          </div>
        ) : sectionsError ? (
          <div className="flex items-center justify-center py-16 gap-3 text-red-600">
            <AlertCircle className="w-5 h-5" /> Failed to load sections. Check your connection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  {['Section', 'Homeroom Teacher', 'Students', 'Subjects', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FileCheck className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-bold text-gray-900">No sections found</p>
                      <p className="text-xs text-gray-400 mt-1">Adjust filters or select an academic year.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((section: AdminSectionSummary) => (
                    <tr key={section.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-black text-gray-900">
                        {section.displayName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {section.homeroomTeacher ?? (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {section.enrolledCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {section.submittedSubjects}/{section.totalSubjects} submitted
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1',
                            STATUS_STYLES[section.status] ?? 'bg-gray-100 text-gray-500',
                          )}
                        >
                          {section.status === 'Submitted' && <CheckCircle className="w-3 h-3" />}
                          {section.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                          {section.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openModal(section)}
                          disabled={!academicYearId}
                          className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors inline-flex items-center gap-2 disabled:opacity-40"
                        >
                          {section.submissionStatus === 'complete' ? (
                            <><FileCheck className="w-4 h-4" /> Review</>
                          ) : (
                            <><Eye className="w-4 h-4" /> View</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Review Modal ── */}
      {modalOpen && selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {selectedSection.displayName} — Report Cards
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Homeroom: {selectedSection.homeroomTeacher ?? 'Unassigned'} &bull;{' '}
                  {selectedSection.enrolledCount} students &bull;{' '}
                  {selectedSection.submittedSubjects}/{selectedSection.totalSubjects} subjects submitted
                </p>
              </div>
              <span
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shrink-0',
                  STATUS_STYLES[selectedSection.status] ?? 'bg-gray-100 text-gray-500',
                )}
              >
                {selectedSection.status}
              </span>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto flex-1">
              {cardsLoading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading report cards…
                </div>
              ) : cardsError ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  Failed to load report cards. Ensure results have been submitted for this section.
                </div>
              ) : reportCards.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-bold text-gray-700">No compiled report cards yet</p>
                  <p className="text-sm mt-1">
                    Subject teachers need to submit all results before report cards are available.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-900 text-white">
                        <th className="p-2 text-left" rowSpan={2}>Rank</th>
                        <th className="p-2 text-left" rowSpan={2} style={{ minWidth: 150 }}>Student</th>
                        {reportCards[0]?.subjectResults.map((s: any) => (
                          <th key={s.subjectId} className="p-2 text-center" colSpan={3}>
                            {s.subjectName}
                          </th>
                        ))}
                        <th className="p-2 text-center" rowSpan={2}>Total</th>
                        <th className="p-2 text-center" rowSpan={2}>Avg</th>
                        <th className="p-2 text-center" rowSpan={2}>Grade</th>
                        <th className="p-2 text-center" rowSpan={2}>Abs</th>
                      </tr>
                      <tr className="bg-gray-700 text-white">
                        {reportCards[0]?.subjectResults.map((s: any) => (
                          <React.Fragment key={`${s.subjectId}-sub`}>
                            <th className="p-1 text-center">S1</th>
                            <th className="p-1 text-center">S2</th>
                            <th className="p-1 text-center bg-green-800">Yr</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reportCards.map((card: AdminReportCardStudent, ri: number) => (
                        <tr
                          key={card.studentId}
                          className={cn(
                            'hover:bg-blue-50/40 cursor-pointer transition-colors',
                            printStudentId === card.studentId ? 'bg-blue-50' : ri % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                          )}
                          onClick={() =>
                            setPrintStudentId(
                              printStudentId === card.studentId ? null : card.studentId,
                            )
                          }
                        >
                          <td className="p-2 text-center font-bold">{card.overallRank || '—'}</td>
                          <td className="p-2 font-semibold whitespace-nowrap">
                            <span className="text-gray-400 text-xs mr-1">{card.admissionNo}</span>
                            {card.firstName} {card.lastName}
                          </td>
                          {card.subjectResults.map((s) => (
                            <React.Fragment key={s.subjectId}>
                              <td className="p-2 text-center">{fmt(s.sem1Avg)}</td>
                              <td className="p-2 text-center">{fmt(s.sem2Avg)}</td>
                              <td className="p-2 text-center bg-green-50 font-bold">{fmt(s.yearlyAvg)}</td>
                            </React.Fragment>
                          ))}
                          <td className="p-2 text-center font-bold">{card.overallTotal}</td>
                          <td className="p-2 text-center font-bold">{fmt(card.overallAverage)}</td>
                          <td className="p-2 text-center font-black text-blue-900">
                            {gradeBand(card.overallAverage)}
                          </td>
                          <td className="p-2 text-center">{card.absentDays}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50">
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              {reportCards.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={exportCsv}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-800 transition-colors inline-flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportCards;
