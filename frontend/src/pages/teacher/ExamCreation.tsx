import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Clock, CheckCircle2, Save, Send, HelpCircle,
  AlertCircle, FolderOpen, X, BadgeCheck, XCircle, RefreshCw,
  FileText, AlertTriangle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Toaster, toast } from 'sonner';
import { api } from '../../lib/api';
import { formatClassSection } from '../../lib/classSection';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

interface Subject {
  id: string;
  name: string;
}

type TeachingAssignment = {
  subjectId: string;
  classSectionId: string;
  Subject: Subject;
  ClassSection: { id: string; name: string };
};

type ExamStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface TeacherExam {
  id: string;
  title: string;
  status: ExamStatus;
  duration: number;
  instructions?: string | null;
  Subject?: { name: string } | null;
  Class?: { name: string } | null;
  ClassSection?: { name: string } | null;
  questions?: Array<{ id: string; text: string }>;
  updatedAt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extracts a rejection reason stored in the instructions field.
 * The backend writes: "[REJECTION_REASON]: <reason>"
 */
function extractRejectionReason(instructions?: string | null): string | null {
  if (!instructions) return null;
  const match = instructions.match(/^\[REJECTION_REASON\]:\s*(.+)/s);
  return match ? match[1].trim() : null;
}

const STATUS_CONFIG: Record<ExamStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  DRAFT:    { label: 'Draft',           bg: 'bg-gray-100',   text: 'text-gray-600',  icon: <FileText  className="w-3.5 h-3.5" /> },
  PENDING:  { label: 'Pending Review',  bg: 'bg-amber-100',  text: 'text-amber-700', icon: <Clock     className="w-3.5 h-3.5" /> },
  APPROVED: { label: 'Approved',        bg: 'bg-green-100',  text: 'text-green-700', icon: <BadgeCheck className="w-3.5 h-3.5" /> },
  REJECTED: { label: 'Rejected',        bg: 'bg-red-100',    text: 'text-red-700',   icon: <XCircle   className="w-3.5 h-3.5" /> },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExamCreation() {
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([]);
  const [teacherExams, setTeacherExams] = useState<TeacherExam[]>([]);
  const [approvedExams, setApprovedExams] = useState<TeacherExam[]>([]);

  const [examData, setExamData] = useState({
    title: '',
    subjectId: '',
    classId: '',
    classSectionId: '',
    duration: 60,
    instructions: '',
  });

  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', text: '', options: ['', '', '', ''], correctAnswer: 0, marks: 10 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Draft modal state
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftsList, setDraftsList] = useState<any[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);

  // Approved exams expanded state (exam id → bool)
  const [expandedApproved, setExpandedApproved] = useState<Record<string, boolean>>({});

  // ── Data loaders ────────────────────────────────────────────────────────────

  const loadTeacherExams = useCallback(async () => {
    try {
      const data = await api.get<TeacherExam[]>('/examinations/teacher');
      setTeacherExams(data);
    } catch {
      toast.error('Failed to load your examinations');
    }
  }, []);

  const loadApprovedExams = useCallback(async () => {
    try {
      const data = await api.get<TeacherExam[]>('/examinations/approved-for-teacher');
      setApprovedExams(data);
    } catch {
      // Non-critical — don't spam with toasts
    }
  }, []);

  useEffect(() => {
    api
      .get<{ assignments: TeachingAssignment[] }>('/examinations/form-data')
      .then((data) => {
        setTeachingAssignments(data.assignments);
        const first = data.assignments[0];
        if (first) {
          setExamData((prev) => ({
            ...prev,
            subjectId: first.subjectId,
            classSectionId: first.classSectionId,
          }));
        }
      })
      .catch((err) => toast.error('Failed to load form data: ' + err.message));

    loadTeacherExams();
    loadApprovedExams();
  }, [loadTeacherExams, loadApprovedExams]);

  // ── Question helpers ────────────────────────────────────────────────────────

  const addQuestion = () =>
    setQuestions((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), text: '', options: ['', '', '', ''], correctAnswer: 0, marks: 10 },
    ]);

  const removeQuestion = (id: string) => {
    if (questions.length > 1) setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, text: string) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, text } : q)));

  const updateQuestionMarks = (id: string, marks: number) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, marks } : q)));

  const updateOption = (qId: string, optIdx: number, text: string) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId ? { ...q, options: q.options.map((opt, i) => (i === optIdx ? text : opt)) } : q,
      ),
    );

  const setCorrectAnswer = (qId: string, idx: number) =>
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, correctAnswer: idx } : q)));

  // ── Draft modal ─────────────────────────────────────────────────────────────

  const handleOpenDraftsModal = async () => {
    setIsLoadingDrafts(true);
    setIsDraftModalOpen(true);
    try {
      const data = await api.get<any[]>('/examinations/drafts');
      setDraftsList(data);
    } catch {
      toast.error('Could not load saved drafts.');
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  const handleSelectDraft = (draft: any) => {
    const defaultSubjectId = teachingAssignments[0]?.subjectId || '';
    setEditingExamId(draft.id);
    setExamData({
      title: draft.title || '',
      subjectId: draft.Subject?.id || draft.subjectId || defaultSubjectId,
      classId: draft.Class?.id || draft.classId || '',
      classSectionId:
        draft.ClassSection?.id || draft.classSectionId || teachingAssignments[0]?.classSectionId || '',
      duration: draft.duration || 60,
      instructions: draft.instructions || '',
    });

    if (draft.questions?.length) {
      setQuestions(
        draft.questions.map((q: any) => ({
          id: q.id || Math.random().toString(36).substring(2, 9),
          text: q.questionText || q.text || '',
          options: q.options?.map((opt: any) => opt.optionText || '') || ['', '', '', ''],
          correctAnswer: q.options?.findIndex((opt: any) => opt.isCorrect === true) ?? 0,
          marks: q.marks || 10,
        })),
      );
    }

    setIsDraftModalOpen(false);
    toast.success(`Loaded draft: ${draft.title || 'Untitled Exam'}`);
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await api.delete(`/examinations/${draftId}`);
      setDraftsList((prev) => prev.filter((d) => d.id !== draftId));
      loadTeacherExams();
      toast.success('Draft deleted');
    } catch (err: any) {
      toast.error(err.message || 'Could not delete draft');
    }
  };

  // ── Submit (Save Draft / Send for Review) ───────────────────────────────────

  const handleSubmit = async (status: 'DRAFT' | 'PENDING') => {
    if (!examData.title || !examData.subjectId || !examData.classSectionId) {
      toast.error('Please fill in the title, subject, and assigned section');
      return;
    }

    if (status === 'PENDING' && questions.some((q) => !q.text || q.options.some((opt) => !opt))) {
      toast.error('Please fill in all questions and options before submitting for review');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title: examData.title || 'Untitled Examination',
      subjectId: examData.subjectId,
      classId: examData.classId,
      classSectionId: examData.classSectionId,
      duration: Number(examData.duration),
      status,
      questions: questions.map((q) => ({
        questionText: q.text,
        marks: Number(q.marks) || 10,
        options: q.options.map((optText, optIdx) => ({
          optionText: optText,
          isCorrect: q.correctAnswer === optIdx,
        })),
      })),
    };

    try {
      if (editingExamId) {
        await api.patch(`/examinations/${editingExamId}`, payload);
      } else {
        const response = await api.post<any>('/examinations', payload);
        if (response?.id) setEditingExamId(response.id);
      }

      if (status === 'DRAFT') {
        toast.success('Exam saved as draft');
      } else {
        toast.success('Exam submitted for review — the admin will be notified');
        // Reset form on successful submit for review
        setExamData((prev) => ({ ...prev, title: '', instructions: '' }));
        setQuestions([{ id: '1', text: '', options: ['', '', '', ''], correctAnswer: 0, marks: 10 }]);
        setEditingExamId(null);
      }

      await loadTeacherExams();
      await loadApprovedExams();
    } catch (err: any) {
      toast.error(`Failed to save examination: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived data ────────────────────────────────────────────────────────────

  const draftExams    = teacherExams.filter((e) => e.status === 'DRAFT');
  const pendingExams  = teacherExams.filter((e) => e.status === 'PENDING');
  const rejectedExams = teacherExams.filter((e) => e.status === 'REJECTED');

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">

      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Create New Examination</h2>
          <p className="text-gray-500 mt-1">Design your exam questions. Results are auto-graded.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleOpenDraftsModal}
            className="flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-2xl text-sm font-black text-gray-700 uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-sm"
          >
            <FolderOpen className="w-4 h-4" /> View Saved Drafts
          </button>
          <button
            disabled={isSubmitting}
            type="button"
            onClick={() => handleSubmit('DRAFT')}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-black text-gray-700 uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button
            disabled={isSubmitting}
            type="button"
            onClick={() => handleSubmit('PENDING')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Sending…' : 'Send to Exam Review'}
          </button>
        </div>
      </div>

      {/* ── Exam metadata form ── */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-4">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
            Exam Title
          </label>
          <input
            type="text"
            placeholder="e.g. Mathematics Mid-Term Exam 2026"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-gray-900 transition-all placeholder:text-gray-300"
            value={examData.title}
            onChange={(e) => setExamData({ ...examData, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
            Subject
          </label>
          <select
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-gray-900 appearance-none"
            value={examData.subjectId}
            onChange={(e) => setExamData({ ...examData, subjectId: e.target.value })}
          >
            {teachingAssignments.length === 0 ? (
              <option value="">Loading…</option>
            ) : (
              [...new Map(teachingAssignments.map((item) => [item.subjectId, item.Subject])).values()].map(
                (s) => <option key={s.id} value={s.id}>{s.name}</option>,
              )
            )}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
            Section
          </label>
          <select
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-gray-900 appearance-none"
            value={examData.classSectionId}
            onChange={(e) => setExamData({ ...examData, classSectionId: e.target.value })}
          >
            {teachingAssignments
              .filter((item) => item.subjectId === examData.subjectId)
              .map((item) => (
                <option key={item.classSectionId} value={item.classSectionId}>
                  {formatClassSection(item.ClassSection)}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
            Duration (Mins)
          </label>
          <div className="relative">
            <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="number"
              min={5}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-14 pr-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-gray-900"
              value={examData.duration}
              onChange={(e) => setExamData({ ...examData, duration: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* ── Questions builder ── */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            Exam Questions ({questions.length})
          </h3>
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>

        {questions.map((question, qIdx) => (
          <div key={question.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-900 rounded-2xl flex items-center justify-center text-white font-black">
                    {qIdx + 1}
                  </div>
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">
                    Question Details
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-10">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-2">
                  Question Text
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter the question here…"
                  className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-8 py-6 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-lg text-gray-900 resize-none transition-all placeholder:text-gray-200"
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {question.options.map((option, oIdx) => {
                  const isSelected = question.correctAnswer === oIdx;
                  return (
                    <div
                      key={oIdx}
                      onClick={() => setCorrectAnswer(question.id, oIdx)}
                      className={cn(
                        'relative rounded-3xl transition-all border-2 cursor-pointer p-4 pr-14',
                        isSelected
                          ? 'bg-green-50 border-green-300 shadow-sm'
                          : 'bg-gray-50 border-transparent hover:border-blue-100',
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCorrectAnswer(question.id, oIdx); }}
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors shrink-0',
                            isSelected ? 'bg-green-600 text-white' : 'bg-white text-gray-400 hover:bg-gray-100',
                          )}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </button>
                        <input
                          type="text"
                          placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                          className="bg-transparent border-none outline-none font-bold text-gray-900 w-full placeholder:text-gray-300"
                          value={option}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateOption(question.id, oIdx, e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCorrectAnswer(question.id, oIdx); }}
                        className={cn(
                          'absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all',
                          isSelected ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400 hover:bg-gray-300',
                        )}
                        title={`Mark Option ${String.fromCharCode(65 + oIdx)} as correct`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="px-8 py-4 mt-6 bg-gray-50/80 border border-gray-100 rounded-2xl flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Auto-Grading Active
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Marks:</span>
                  <input
                    type="number"
                    min={1}
                    value={question.marks}
                    onChange={(e) => updateQuestionMarks(question.id, Number(e.target.value))}
                    className="w-16 bg-white border border-gray-200 rounded-lg py-1 px-2 font-black text-blue-900 text-center outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="w-full py-12 bg-gray-50 border-4 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all group"
        >
          <div className="w-16 h-16 bg-white rounded-[2rem] shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8" />
          </div>
          <span className="text-sm font-black uppercase tracking-[0.2em]">Add Another Question</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ── APPROVED EXAMS DASHBOARD ──────────────────────────────────────────
          Released back to teacher after admin approval.
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-[2rem] border border-green-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
              <BadgeCheck className="w-6 h-6 text-green-600" />
              Approved Examinations
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Exams reviewed and cleared by admin — ready to assign to students.
            </p>
          </div>
          <button
            onClick={loadApprovedExams}
            className="p-2 text-green-700 hover:bg-green-100 rounded-xl transition-colors"
            title="Refresh approved exams"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {approvedExams.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <BadgeCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-gray-500">No approved exams yet</p>
            <p className="text-sm mt-1">
              Submit an exam for review — it will appear here once the admin approves it.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvedExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-green-200 overflow-hidden"
              >
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-green-50/50 transition-colors"
                  onClick={() =>
                    setExpandedApproved((prev) => ({ ...prev, [exam.id]: !prev[exam.id] }))
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-700">
                      <BadgeCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900">{exam.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {exam.Subject?.name} &bull; {exam.ClassSection?.name} &bull;{' '}
                        {exam.duration} mins &bull; {exam.questions?.length ?? 0} questions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <BadgeCheck className="w-3.5 h-3.5" /> Approved
                    </span>
                    <span className="text-xs text-gray-400">
                      {expandedApproved[exam.id] ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {expandedApproved[exam.id] && (
                  <div className="px-5 pb-5 border-t border-green-100 pt-4">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                      Questions Preview ({exam.questions?.length ?? 0})
                    </p>
                    {exam.questions && exam.questions.length > 0 ? (
                      <ol className="space-y-2">
                        {exam.questions.map((q, idx) => (
                          <li key={q.id} className="text-sm text-gray-700 bg-gray-50 px-4 py-2 rounded-xl">
                            <span className="font-bold text-blue-900 mr-2">{idx + 1}.</span>
                            {q.text}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No question details available.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ── ALL SUBMITTED EXAMINATIONS LOG ────────────────────────────────────
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600" />
            Your Examination History
          </h3>
          <button
            onClick={loadTeacherExams}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {teacherExams.length === 0 ? (
          <p className="text-gray-400 italic">No exams yet. Your created exams will appear here.</p>
        ) : (
          <div className="space-y-3">
            {teacherExams.map((exam) => {
              const cfg = STATUS_CONFIG[exam.status] ?? STATUS_CONFIG.DRAFT;
              const rejectionReason = exam.status === 'REJECTED'
                ? extractRejectionReason(exam.instructions)
                : null;

              return (
                <div
                  key={exam.id}
                  className={cn(
                    'rounded-2xl border overflow-hidden',
                    exam.status === 'REJECTED' ? 'border-red-200' : 'border-gray-100',
                  )}
                >
                  <div className="p-4 bg-gray-50 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn('p-2 rounded-xl shrink-0', cfg.bg)}>
                        <span className={cfg.text}>{cfg.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{exam.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {exam.Subject?.name}
                          {exam.ClassSection?.name ? ` • ${exam.ClassSection.name}` : ''}
                          {exam.duration ? ` • ${exam.duration} mins` : ''}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase shrink-0 flex items-center gap-1.5',
                        cfg.bg,
                        cfg.text,
                      )}
                    >
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  {/* Rejection feedback banner */}
                  {rejectionReason && (
                    <div className="px-4 py-3 bg-red-50 border-t border-red-100 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-red-700 uppercase tracking-widest mb-0.5">
                          Admin Feedback
                        </p>
                        <p className="text-sm text-red-700">{rejectionReason}</p>
                        <p className="text-xs text-red-500 mt-1">
                          Please update and re-submit this exam for review.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Saved Drafts Modal ── */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-900">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Saved Drafts</h3>
                  <p className="text-xs text-gray-400 font-bold">Select a draft to resume editing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDraftModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingDrafts ? (
              <div className="py-12 text-center text-gray-400 font-bold">Loading drafts…</div>
            ) : draftsList.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-bold">No saved drafts found.</div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                {draftsList.map((draft) => (
                  <div
                    key={draft.id}
                    onClick={() => handleSelectDraft(draft)}
                    className="p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-black text-gray-900 group-hover:text-blue-900 transition-colors">
                        {draft.title || 'Untitled Examination'}
                      </h4>
                      <p className="text-xs text-gray-400 font-bold mt-1">
                        Updated: {new Date(draft.updatedAt).toLocaleDateString()} at{' '}
                        {new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-white group-hover:bg-blue-900 group-hover:text-white text-gray-700 px-4 py-2 rounded-xl transition-all shadow-sm">
                        Load Draft
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteDraft(draft.id); }}
                        className="text-xs font-bold text-red-600 px-2 py-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
}
