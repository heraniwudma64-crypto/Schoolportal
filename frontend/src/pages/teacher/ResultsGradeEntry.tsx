import React, { useState, useEffect, useMemo } from 'react';
import { Search, Save, Calculator, ChevronRight, Send } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Toaster, toast } from 'sonner';
import { api } from '../../lib/api';
import { formatClassSection } from '../../lib/classSection';
import { getEnrolledStudents } from '../../api/roster';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeachingAssignment {
  id: string;
  classSectionId: string;
  subjectId: string;
  academicYearId: string;
  ClassSection: { id: string; name: string; GradeLevel?: { name: string } };
  Subject: { id: string; name: string };
}

interface GradeRow {
  id: string;       // student.id
  name: string;
  mid: number;
  assignment: number;
  quiz: number;
  classwork: number;
  final: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "Quarter 1" → "TERM_1", already-coded strings pass through unchanged */
function toTermCode(quarter: string): string {
  return quarter.startsWith('TERM_') ? quarter : quarter.replace('Quarter ', 'TERM_');
}

const calculateTotal = (grade: GradeRow) =>
  (grade.mid || 0) + (grade.assignment || 0) + (grade.quiz || 0) +
  (grade.classwork || 0) + (grade.final || 0);

// ─── Component ────────────────────────────────────────────────────────────────

const ResultsGradeEntry = () => {
  const [selectedQuarter, setSelectedQuarter] = useState('Quarter 1');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([]);

  const selectedAssignment = useMemo(
    () => teachingAssignments.find((a) => a.id === selectedAssignmentId) ?? null,
    [selectedAssignmentId, teachingAssignments],
  );

  // ── Load teaching assignments on mount ──────────────────────────────────────
  useEffect(() => {
    api
      .get<TeachingAssignment[]>('/teachers/assignments')
      .then((assignments) => {
        setTeachingAssignments(assignments);
        if (assignments[0]) setSelectedAssignmentId(assignments[0].id);
      })
      .catch(() => toast.error('Could not load your active class-subject assignments'));
  }, []);

  // ── Load enrolled students whenever assignment or quarter changes ────────────
  useEffect(() => {
    if (!selectedAssignment) { setGrades([]); return; }

    let cancelled = false;
    setLoading(true);

    getEnrolledStudents(selectedAssignment.academicYearId, selectedAssignment.classSectionId)
      .then((data) => {
        if (cancelled) return;
        if (data.length === 0) {
          setGrades([]);
          toast.info(`No students found enrolled in ${formatClassSection(selectedAssignment.ClassSection)}`);
          return;
        }
        setGrades(
          data.map((s) => ({
            id: s.id,
            name: s.name || `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || 'Student',
            mid: 0,
            assignment: 0,
            quiz: 0,
            classwork: 0,
            final: 0,
          })),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch students:', err);
        toast.error('Could not load students for this class.');
        setGrades([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [selectedAssignment]);

  // ── Grade change handler ─────────────────────────────────────────────────────
  const handleGradeChange = (id: string, field: string, value: string) => {
    const max = field === 'final' ? 40 : field === 'quiz' || field === 'classwork' ? 10 : 20;
    const num = Math.min(Math.max(Number(value) || 0, 0), max);
    setGrades((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: num } : g)));
  };

  // ── Build the grades payload used by both save and submit ────────────────────
  const buildGradesPayload = (rows: GradeRow[]) =>
    rows.map((g) => ({ studentId: g.id, marks: calculateTotal(g) }));

  // ─────────────────────────────────────────────────────────────────────────────
  // "Save Class Results" — writes all rows to SubjectResult as DRAFT
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedAssignment) return toast.error('Select one of your active class-subject assignments');
    if (grades.length === 0) return toast.error('No students loaded for this class');

    setSaving(true);
    try {
      const result = await api.post<{ savedCount: number; ignoredStudentIds: string[] }>('/results/draft', {
        classSectionId: selectedAssignment.classSectionId,
        subjectId:      selectedAssignment.subjectId,
        academicYearId: selectedAssignment.academicYearId,
        term:           toTermCode(selectedQuarter),
        grades:         buildGradesPayload(grades),
      });

      const ignored = result.ignoredStudentIds?.length ?? 0;
      if (ignored > 0) {
        toast.success(`Saved ${result.savedCount} results (${ignored} students skipped — no longer enrolled)`);
      } else {
        toast.success(`Saved ${result.savedCount} student results`);
      }
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? err?.message ?? 'Save failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Per-row "Publish" button — saves that one student then marks them SUBMITTED
  // ─────────────────────────────────────────────────────────────────────────────
  const publishStudent = async (studentId: string) => {
    if (!selectedAssignment) return toast.error('Select one of your active class-subject assignments');
    const term = toTermCode(selectedQuarter);
    try {
      // 1. Upsert the draft row first so the publish call always finds it
      await api.post('/results/draft', {
        classSectionId: selectedAssignment.classSectionId,
        subjectId:      selectedAssignment.subjectId,
        academicYearId: selectedAssignment.academicYearId,
        term,
        grades: buildGradesPayload(grades.filter((g) => g.id === studentId)),
      });
      // 2. Mark it SUBMITTED
      await api.post('/results/publish-student', {
        classSectionId: selectedAssignment.classSectionId,
        subjectId:      selectedAssignment.subjectId,
        academicYearId: selectedAssignment.academicYearId,
        term,
        studentId,
      });
      toast.success('Student result published');
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? err?.message ?? 'Could not publish result';
      toast.error(msg);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // "Send to Homeroom" — saves all grades inline then submits in one round-trip
  // ─────────────────────────────────────────────────────────────────────────────
  const submitToHomeroom = async () => {
    if (!selectedAssignment) return toast.error('Select one of your active class-subject assignments');
    if (grades.length === 0) return toast.error('No students loaded — cannot submit empty results');

    setSubmitting(true);
    try {
      const result = await api.post<{ success: boolean; count: number }>('/results/submit-to-homeroom', {
        classSectionId: selectedAssignment.classSectionId,
        subjectId:      selectedAssignment.subjectId,
        academicYearId: selectedAssignment.academicYearId,
        term:           toTermCode(selectedQuarter),
        // Pass grades inline so the backend auto-saves before the count check.
        // This means the teacher can press "Send to Homeroom" without needing
        // to press "Save Class Results" first.
        grades:         buildGradesPayload(grades),
      });
      toast.success(`${result.count} student results sent to homeroom teacher`);
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? err?.message ?? 'Could not submit results';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGrades = grades.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Academic Grade Entry</h2>
          <p className="text-sm text-gray-500">
            Enter student scores for each grading component, save, then send to your homeroom teacher.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={handleSave}
            disabled={saving || grades.length === 0 || !selectedAssignment}
            className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Class Results'}
          </button>
          <button
            onClick={submitToHomeroom}
            disabled={submitting || saving || grades.length === 0 || !selectedAssignment}
            className="flex items-center gap-2 px-4 py-2 border border-blue-900 text-blue-900 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-blue-50 transition-colors"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Sending…' : 'Send to Homeroom'}
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Quarter</label>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option>Quarter 1</option>
            <option>Quarter 2</option>
            <option>Quarter 3</option>
            <option>Quarter 4</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
            Assigned Class &amp; Subject
          </label>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Select an assigned class and subject</option>
            {teachingAssignments.map((a) => (
              <option key={a.id} value={a.id}>
                {formatClassSection(a.ClassSection)} — {a.Subject.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Name or ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Grade table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4 text-center">Mid (20)</th>
                <th className="px-6 py-4 text-center">Asgn (20)</th>
                <th className="px-6 py-4 text-center">Quiz (10)</th>
                <th className="px-6 py-4 text-center">C.W (10)</th>
                <th className="px-6 py-4 text-center">Final (40)</th>
                <th className="px-6 py-4 text-right">Total (100)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 font-medium">
                    Loading enrolled students
                    {selectedAssignment ? ` for ${formatClassSection(selectedAssignment.ClassSection)}` : ''}…
                  </td>
                </tr>
              ) : filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400 font-medium">
                    {selectedAssignment
                      ? 'No students found for this class section.'
                      : 'Select a class-subject assignment above to begin.'}
                  </td>
                </tr>
              ) : (
                filteredGrades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{grade.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold">ID: {grade.id}</p>
                    </td>
                    {(['mid', 'assignment', 'quiz', 'classwork', 'final'] as const).map((field) => (
                      <td key={field} className="px-6 py-4">
                        <div className="flex justify-center">
                          <input
                            type="number"
                            min={0}
                            max={field === 'final' ? 40 : field === 'quiz' || field === 'classwork' ? 10 : 20}
                            value={grade[field]}
                            onChange={(e) => handleGradeChange(grade.id, field, e.target.value)}
                            className="w-16 text-center bg-gray-50 border border-gray-100 rounded-lg py-2 text-sm font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-full text-sm font-black',
                          calculateTotal(grade) >= 90
                            ? 'bg-green-100 text-green-700'
                            : calculateTotal(grade) >= 70
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700',
                        )}
                      >
                        {calculateTotal(grade)}
                      </span>
                      <button
                        onClick={() => publishStudent(grade.id)}
                        className="ml-2 text-xs font-bold text-blue-800 hover:underline"
                      >
                        Publish
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info bar */}
      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center text-white">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900">Auto-Calculate Semester Average</p>
            <p className="text-xs text-blue-600">
              Component scores are summed automatically. Save first, then send to Homeroom to lock results.
            </p>
          </div>
        </div>
        <button
          onClick={() => toast.info('All grade points recalculated.')}
          className="flex items-center gap-2 text-sm font-black text-blue-900 uppercase tracking-widest hover:underline cursor-pointer"
        >
          Recalculate All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <Toaster position="top-right" />
    </div>
  );
};

export default ResultsGradeEntry;
