import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, TrendingUp, BookOpen, ClipboardList } from 'lucide-react';
import { api } from '../../lib/api';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GradeRow {
  id: string;
  subject: string;
  quarter: string;
  mid: number;
  assignment: number;
  quiz: number;
  classwork: number;
  final: number;
  score: number;
  createdAt: string;
}

interface SubjectResultRow {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  term: string;   // "TERM_1" … "TERM_4"
  marks: number;
  status: string;
  updatedAt: string;
}

interface ResultsResponse {
  grades: GradeRow[];
  subjectResults: SubjectResultRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TERM_LABELS: Record<string, string> = {
  TERM_1: 'Term 1 (Q1)',
  TERM_2: 'Term 2 (Q2)',
  TERM_3: 'Term 3 (Q3)',
  TERM_4: 'Term 4 (Q4)',
};

function letterGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function gradeColor(letter: string): string {
  return letter === 'A'
    ? 'bg-green-100 text-green-700'
    : letter === 'B'
    ? 'bg-blue-100 text-blue-700'
    : letter === 'C'
    ? 'bg-amber-100 text-amber-700'
    : letter === 'D'
    ? 'bg-orange-100 text-orange-700'
    : 'bg-red-100 text-red-700';
}

// ─── Component ────────────────────────────────────────────────────────────────

const Results = () => {
  const [activeTab, setActiveTab] = useState<'termResults' | 'grades'>('termResults');

  const { data, isLoading, isError } = useQuery<ResultsResponse>({
    queryKey: ['my-results'],
    queryFn: async () => {
      const res = await api.get<any>('/students/me/results');
      // Handle both old (array) and new ({grades, subjectResults}) shapes
      if (Array.isArray(res)) return { grades: res, subjectResults: [] };
      return {
        grades: Array.isArray(res?.grades) ? res.grades : [],
        subjectResults: Array.isArray(res?.subjectResults) ? res.subjectResults : [],
      };
    },
  });

  const grades = data?.grades ?? [];
  const subjectResults = data?.subjectResults ?? [];

  // Stats
  const gradeAvg =
    grades.length > 0
      ? grades.reduce((s, g) => s + (Number(g.score) || 0), 0) / grades.length
      : null;

  // Group SubjectResult rows by subject name for a compact term-by-term view
  const subjectMap = new Map<string, Map<string, number>>();
  subjectResults.forEach((r) => {
    if (!subjectMap.has(r.subjectName)) subjectMap.set(r.subjectName, new Map());
    subjectMap.get(r.subjectName)!.set(r.term, r.marks);
  });
  const allTerms = [...new Set(subjectResults.map((r) => r.term))].sort();
  const yearlyAvgAll =
    subjectResults.length > 0
      ? subjectResults.reduce((s, r) => s + r.marks, 0) / subjectResults.length
      : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Academic Results</h2>
        <p className="text-sm text-gray-500">Your published exam results and term marks.</p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-900 text-white p-5 rounded-2xl shadow-lg">
          <GraduationCap className="w-7 h-7 text-blue-300 mb-3" />
          <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">Yearly Average</p>
          <p className="text-3xl font-black">
            {isLoading ? '…' : yearlyAvgAll != null ? `${yearlyAvgAll.toFixed(1)}%` : '—'}
          </p>
          <p className="text-xs text-blue-300 mt-1">Based on {subjectResults.length} term mark{subjectResults.length === 1 ? '' : 's'}</p>
        </div>
        <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subjects</p>
            <p className="text-2xl font-black text-gray-900">{isLoading ? '…' : subjectMap.size}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Component Records</p>
            <p className="text-2xl font-black text-gray-900">{isLoading ? '…' : grades.length}</p>
            {gradeAvg != null && (
              <p className="text-xs text-gray-400">Avg: {gradeAvg.toFixed(1)}%</p>
            )}
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'termResults', label: 'Term Results', icon: ClipboardList },
          { key: 'grades', label: 'Component Grades', icon: GraduationCap },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Term Results ── */}
      {activeTab === 'termResults' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <p className="py-12 text-center text-gray-500">Loading results…</p>
          ) : isError ? (
            <p className="py-12 text-center text-red-600">Could not load results.</p>
          ) : subjectMap.size === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-gray-700">No finalized term results yet</p>
              <p className="text-sm mt-1">Results will appear here once your homeroom teacher finalizes marks.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Subject</th>
                    {allTerms.map((t) => (
                      <th key={t} className="px-6 py-4 text-center">{TERM_LABELS[t] ?? t}</th>
                    ))}
                    <th className="px-6 py-4 text-center">Yearly Avg</th>
                    <th className="px-6 py-4 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...subjectMap.entries()].map(([subjectName, termMap]) => {
                    const scores = allTerms.map((t) => termMap.get(t) ?? null);
                    const valid = scores.filter((v): v is number => v !== null);
                    const avg = valid.length ? valid.reduce((s, v) => s + v, 0) / valid.length : null;
                    const grade = avg != null ? letterGrade(avg) : '—';
                    return (
                      <tr key={subjectName} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900">{subjectName}</td>
                        {scores.map((score, ti) => (
                          <td key={ti} className="px-6 py-4 text-center">
                            {score != null ? (
                              <span className="font-bold text-gray-900">{score}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        ))}
                        <td className="px-6 py-4 text-center font-black text-blue-900">
                          {avg != null ? avg.toFixed(1) : '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {grade !== '—' && (
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${gradeColor(grade)}`}>
                              {grade}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Component Grades ── */}
      {activeTab === 'grades' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="font-bold">Subject</TableHead>
                <TableHead className="font-bold">Quarter</TableHead>
                <TableHead className="font-bold text-center">Components (Mid/Asgn/Quiz/CW/Final)</TableHead>
                <TableHead className="font-bold text-center">Total</TableHead>
                <TableHead className="font-bold text-center">Grade</TableHead>
                <TableHead className="font-bold text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-500">Loading…</TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-red-600">Could not load grades.</TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && grades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-400">
                    No component grades recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {grades.map((g) => {
                const total = Number(g.score) || 0;
                const letter = letterGrade(total);
                return (
                  <TableRow key={g.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-semibold text-gray-900">{g.subject}</TableCell>
                    <TableCell>{g.quarter}</TableCell>
                    <TableCell className="text-center text-xs text-gray-600">
                      Mid: {g.mid ?? 0} | Asgn: {g.assignment ?? 0} | Quiz: {g.quiz ?? 0} | CW: {g.classwork ?? 0} | Final: {g.final ?? 0}
                    </TableCell>
                    <TableCell className="text-center font-bold text-gray-900">
                      {total} / 100
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${gradeColor(letter)}`}>
                        {letter}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-500">
                      {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Results;
