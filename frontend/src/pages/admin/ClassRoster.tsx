import React, { useState } from 'react';
import {
  Search, RefreshCw, ClipboardList, CheckCircle, XCircle,
  FileText, Eye, Users, TrendingUp, Download, Printer,
  AlertCircle, Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useOutletContext } from 'react-router-dom';
import { getAcademicYears } from '../../api/academicStructure';
import {
  getAdminSections,
  getAdminSectionRoster,
  AdminSectionSummary,
  AdminRosterEntry,
} from '../../api/adminReports';
import { useQuery } from '@tanstack/react-query';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Submitted:        'bg-green-100 text-green-700',
  'Pending Review': 'bg-amber-100 text-amber-700',
  Draft:            'bg-gray-100 text-gray-500',
  Approved:         'bg-green-100 text-green-700',
  Rejected:         'bg-red-100 text-red-700',
};

const TERMS = ['TERM_1', 'TERM_2', 'TERM_3', 'TERM_4'];
const TERM_LABELS: Record<string, string> = {
  TERM_1: 'Term 1', TERM_2: 'Term 2', TERM_3: 'Term 3', TERM_4: 'Term 4',
};

// ─── Component ────────────────────────────────────────────────────────────────

const ClassRoster = () => {
  const { searchQuery: globalSearch = '' } = useOutletContext<{ searchQuery: string }>();
  const [localSearch, setLocalSearch] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedSection, setSelectedSection] = useState<AdminSectionSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState('TERM_1');

  // ── Academic years ───────────────────────────────────────────────────────
  const { data: years = [] } = useQuery({
    queryKey: ['academicYears'],
    queryFn: getAcademicYears,
    onSuccess: (data: any[]) => {
      if (!academicYearId && data.length) {
        setAcademicYearId((data.find((y) => y.isCurrent) ?? data[0]).id);
      }
    },
  } as any);

  // ── Section list ─────────────────────────────────────────────────────────
  const {
    data: sections = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['adminSections', academicYearId],
    queryFn: () => getAdminSections(academicYearId || undefined),
    enabled: !!academicYearId,
  });

  // ── Roster for selected section + term ──────────────────────────────────
  const {
    data: roster = [],
    isLoading: rosterLoading,
    isError: rosterError,
  } = useQuery({
    queryKey: ['adminRoster', selectedSection?.id, academicYearId, selectedTerm],
    queryFn: () => getAdminSectionRoster(selectedSection!.id, academicYearId, selectedTerm),
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
    setModalOpen(true);
  };

  const exportCsv = () => {
    if (!roster.length || !selectedSection) return;
    const subjectNames = Object.keys(roster[0]?.subjectScores ?? {});
    const headers = ['Rank', 'Student', ...subjectNames, 'Total', 'Average'];
    const rows = roster.map((r: AdminRosterEntry) => [
      r.rank, r.studentName,
      ...subjectNames.map((s) => r.subjectScores[s] ?? ''),
      r.totalMarks, r.average,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${selectedSection.displayName}-${selectedTerm}-roster.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Roster Review</h2>
          <p className="text-sm text-gray-500">
            View class rosters and submitted results for each section.
          </p>
        </div>
        <button
          onClick={() => refetch()}
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
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading sections…
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-16 gap-3 text-red-600">
            <AlertCircle className="w-5 h-5" /> Failed to load. Check your connection.
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
                      <ClipboardList className="w-10 h-10 mx-auto text-gray-300 mb-2" />
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
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {section.enrolledCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {section.submittedSubjects}/{section.totalSubjects}
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
                          {section.submissionStatus !== 'none' ? (
                            <><FileText className="w-4 h-4" /> View</>
                          ) : (
                            <><Eye className="w-4 h-4" /> Preview</>
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

      {/* ── Roster Modal ── */}
      {modalOpen && selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {selectedSection.displayName} — Class Roster
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Homeroom: {selectedSection.homeroomTeacher ?? 'Unassigned'} &bull;{' '}
                  {selectedSection.enrolledCount} students
                </p>
              </div>
              {/* Term pills */}
              <div className="flex gap-1">
                {TERMS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTerm(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
                      selectedTerm === t
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    {TERM_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {rosterLoading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading roster…
                </div>
              ) : rosterError ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  Failed to load roster. Ensure results are submitted for this term.
                </div>
              ) : roster.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-bold text-gray-700">No submitted results for {TERM_LABELS[selectedTerm]}</p>
                  <p className="text-sm mt-1">Subject teachers must submit marks for this term first.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-900 text-white">
                        <th className="p-3 text-left">Rank</th>
                        <th className="p-3 text-left" style={{ minWidth: 180 }}>Student</th>
                        {Object.keys(roster[0]?.subjectScores ?? {}).map((s) => (
                          <th key={s} className="p-3 text-center">{s}</th>
                        ))}
                        <th className="p-3 text-center">Total</th>
                        <th className="p-3 text-center">Average</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {roster.map((row: AdminRosterEntry, ri: number) => (
                        <tr key={row.studentId} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-3 text-center font-bold">{row.rank}</td>
                          <td className="p-3 font-semibold whitespace-nowrap">{row.studentName}</td>
                          {Object.keys(roster[0]?.subjectScores ?? {}).map((s) => (
                            <td key={s} className="p-3 text-center">
                              {row.subjectScores[s] ?? '—'}
                            </td>
                          ))}
                          <td className="p-3 text-center font-bold">{row.totalMarks}</td>
                          <td className="p-3 text-center font-bold">{row.average}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-between bg-gray-50">
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              {roster.length > 0 && (
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

export default ClassRoster;
