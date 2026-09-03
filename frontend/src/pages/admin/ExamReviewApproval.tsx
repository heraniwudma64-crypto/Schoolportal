import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCheck, Eye, CheckCircle2, XCircle, MessageSquare,
  Clock, RefreshCw, AlertCircle, BookOpen, Users, ChevronRight,
  BadgeCheck, EyeOff,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Toaster, toast } from 'sonner';
import { api } from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExamOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
}

interface ExamQuestion {
  id: string;
  text: string;
  options: ExamOption[];
}

interface PendingExam {
  id: string;
  title: string;
  duration: number;
  status: string;
  createdAt: string;
  Teacher?: {
    firstName: string;
    lastName: string;
    staffId?: string | null;
    User?: { email?: string | null };
  } | null;
  Subject?: { id: string; name: string; code: string } | null;
  Class?: { id: string; name: string } | null;
  ClassSection?: { id: string; name: string } | null;
  questions: ExamQuestion[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function teacherDisplayName(teacher: PendingExam['Teacher']): string {
  if (!teacher) return 'Unknown Teacher';
  return `${teacher.firstName} ${teacher.lastName}`.trim() || 'Unknown Teacher';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExamReviewApproval() {
  const [exams, setExams] = useState<PendingExam[]>([]);
  const [selectedExam, setSelectedExam] = useState<PendingExam | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);

  // ── Load pending exams ────────────────────────────────────────────────────

  const fetchPendingExams = useCallback((silent = false) => {
    if (!silent) setIsLoading(true);
    api
      .get<PendingExam[]>('/examinations/pending')
      .then((data) => {
        setExams(data);
        // If the currently-selected exam is no longer pending, deselect it
        if (selectedExam) {
          const stillPending = data.find((e) => e.id === selectedExam.id);
          if (!stillPending) {
            setSelectedExam(null);
            setRejectionReason('');
          }
        }
      })
      .catch((err) => toast.error('Failed to load pending exams: ' + err.message))
      .finally(() => setIsLoading(false));
  }, [selectedExam]);

  useEffect(() => {
    fetchPendingExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Review action ─────────────────────────────────────────────────────────

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const exam = exams.find((e) => e.id === id);
    const teacherName = teacherDisplayName(exam?.Teacher);

    if (status === 'REJECTED') {
      if (!rejectionReason.trim()) {
        toast.error('Please provide a rejection reason so the teacher knows what to fix.');
        return;
      }
    }

    if (status === 'APPROVED') {
      const confirmed = window.confirm(
        `Approve "${exam?.title}" by ${teacherName}?\n\n` +
          'Once approved, the exam will be released back to the teacher and can be assigned to students.',
      );
      if (!confirmed) return;
    }

    setIsActioning(true);
    try {
      await api.patch(`/examinations/${id}/review`, {
        status,
        ...(status === 'REJECTED' && { rejectionReason: rejectionReason.trim() }),
      });

      toast.success(
        status === 'APPROVED'
          ? `Exam approved and released to ${teacherName}.`
          : `Exam rejected — feedback sent to ${teacherName}.`,
      );

      setSelectedExam(null);
      setRejectionReason('');
      fetchPendingExams(true);
    } catch (err: any) {
      toast.error('Failed to update exam status: ' + (err.message ?? 'Unknown error'));
    } finally {
      setIsActioning(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const totalQuestions = exams.reduce((n, e) => n + (e.questions?.length ?? 0), 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Exam Review Panel</h2>
          <p className="text-sm text-gray-500">
            Quality-control and approval for teacher-submitted examinations.
          </p>
        </div>
        <button
          onClick={() => fetchPendingExams()}
          disabled={isLoading}
          className="self-start flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-900 transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh Queue
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Review', value: exams.length, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-700' },
          { label: 'Total Questions', value: totalQuestions, icon: MessageSquare, bg: 'bg-blue-50', color: 'text-blue-700' },
          { label: 'Teachers Waiting', value: new Set(exams.map((e) => e.Teacher?.firstName)).size, icon: Users, bg: 'bg-purple-50', color: 'text-purple-700' },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left: exam queue ── */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            /* Loading skeleton */
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] border border-gray-100 p-8 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-100 rounded-lg w-2/3" />
                    <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                    <div className="flex gap-4 mt-2">
                      <div className="h-3 bg-gray-100 rounded-lg w-20" />
                      <div className="h-3 bg-gray-100 rounded-lg w-24" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : exams.length === 0 ? (
            <div className="bg-white p-16 rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-20 h-20 bg-green-50 rounded-[2rem] flex items-center justify-center text-green-600 mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Queue is Clear!</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                All submitted exams have been reviewed. New submissions will appear here automatically.
              </p>
            </div>
          ) : (
            exams.map((exam) => {
              const isSelected = selectedExam?.id === exam.id;
              const teacherName = teacherDisplayName(exam.Teacher);

              return (
                <div
                  key={exam.id}
                  onClick={() => {
                    setSelectedExam(isSelected ? null : exam);
                    setRejectionReason('');
                    setPreviewOpen(true);
                  }}
                  className={cn(
                    'bg-white p-7 rounded-[2rem] shadow-sm border-2 transition-all cursor-pointer',
                    isSelected
                      ? 'border-blue-900 ring-4 ring-blue-500/10'
                      : 'border-transparent hover:border-gray-200',
                  )}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar initials */}
                      <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-700 font-black text-lg shrink-0">
                        {exam.Teacher?.firstName?.[0] ?? '?'}{exam.Teacher?.lastName?.[0] ?? ''}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                          <h3 className="text-lg font-black text-gray-900">{exam.title}</h3>
                          <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                            Pending Review
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                          By{' '}
                          <span className="font-bold text-gray-800">{teacherName}</span>
                          {exam.Teacher?.User?.email && (
                            <span className="text-gray-400"> · {exam.Teacher.User.email}</span>
                          )}
                          {' · '}
                          {exam.Subject?.name ?? '—'}
                          {exam.ClassSection?.name ? ` · ${exam.ClassSection.name}` : ''}
                        </p>
                        <div className="flex gap-5 flex-wrap">
                          <span className="flex items-center gap-1.5 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                            <Clock className="w-3 h-3" /> {exam.duration} mins
                          </span>
                          <span className="flex items-center gap-1.5 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                            <MessageSquare className="w-3 h-3" /> {exam.questions?.length ?? 0} questions
                          </span>
                          <span className="flex items-center gap-1.5 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                            <Clock className="w-3 h-3" /> {timeAgo(exam.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:shrink-0">
                      <span className={cn(
                        'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors',
                        isSelected
                          ? 'bg-blue-900 text-white'
                          : 'bg-gray-50 text-blue-900 hover:bg-blue-900 hover:text-white',
                      )}>
                        {isSelected ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {isSelected ? 'Close' : 'Review'}
                      </span>
                      <ChevronRight className={cn('w-4 h-4 text-gray-300 transition-transform', isSelected && 'rotate-90')} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Right: decision panel ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 sticky top-6 overflow-hidden">
            <div className="p-7 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">Decision Center</h3>
              {selectedExam && (
                <button
                  onClick={() => setPreviewOpen((v) => !v)}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-700 flex items-center gap-1"
                >
                  {previewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {previewOpen ? 'Hide' : 'Show'} questions
                </button>
              )}
            </div>

            {selectedExam ? (
              <div className="p-7 space-y-6">

                {/* Exam title & meta */}
                <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <FileCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-gray-900 text-sm">{selectedExam.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {teacherDisplayName(selectedExam.Teacher)} &bull;{' '}
                      {selectedExam.Subject?.name ?? '—'} &bull;{' '}
                      {selectedExam.duration} mins &bull;{' '}
                      {selectedExam.questions?.length ?? 0} questions
                    </p>
                  </div>
                </div>

                {/* Questions preview */}
                {previewOpen && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                      Question Preview
                    </p>
                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                      {selectedExam.questions?.length === 0 ? (
                        <p className="text-sm text-gray-400 italic text-center py-4">
                          No questions found.
                        </p>
                      ) : (
                        selectedExam.questions?.map((q, idx) => {
                          const correctOption = q.options.find((o) => o.isCorrect);
                          return (
                            <div key={q.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                              <p className="text-sm font-bold text-gray-900 mb-2.5">
                                <span className="text-blue-900 mr-1.5">Q{idx + 1}.</span>
                                {q.text}
                              </p>
                              <div className="space-y-1.5">
                                {q.options.map((opt) => (
                                  <div
                                    key={opt.id}
                                    className={cn(
                                      'px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2',
                                      opt.isCorrect
                                        ? 'bg-green-50 border-green-200 text-green-700'
                                        : 'bg-white border-gray-100 text-gray-500',
                                    )}
                                  >
                                    {opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                                    {opt.optionText}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Rejection reason textarea */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Rejection Reason{' '}
                    <span className="text-red-400 normal-case font-semibold tracking-normal">
                      (required to reject)
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe what the teacher needs to correct before re-submitting…"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium text-sm transition-all resize-none placeholder:text-gray-300"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={isActioning}
                    onClick={() => handleReview(selectedExam.id, 'REJECTED')}
                    className={cn(
                      'flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all gap-2',
                      rejectionReason.trim()
                        ? 'bg-red-50 text-red-600 border-transparent hover:border-red-500 hover:bg-red-100'
                        : 'bg-gray-50 text-gray-300 border-transparent cursor-not-allowed',
                    )}
                    title={!rejectionReason.trim() ? 'Enter a rejection reason first' : 'Reject this exam'}
                  >
                    <XCircle className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {isActioning ? 'Rejecting…' : 'Reject'}
                    </span>
                  </button>

                  <button
                    disabled={isActioning}
                    onClick={() => handleReview(selectedExam.id, 'APPROVED')}
                    className="flex flex-col items-center justify-center p-5 bg-green-50 text-green-600 rounded-2xl border-2 border-transparent hover:border-green-500 hover:bg-green-100 transition-all gap-2 disabled:opacity-50"
                    title="Approve and release this exam to the teacher"
                  >
                    <BadgeCheck className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {isActioning ? 'Approving…' : 'Approve'}
                    </span>
                  </button>
                </div>

                {/* Hint text */}
                <p className="text-[11px] text-gray-400 leading-relaxed text-center">
                  Approving releases the exam back to the teacher.{' '}
                  Rejecting sends your feedback so they can correct and re-submit.
                </p>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400">
                <Eye className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-semibold text-gray-500">Select an exam to review</p>
                <p className="text-xs mt-1">
                  Click any exam card on the left to begin the review.
                </p>
              </div>
            )}
          </div>

          {/* ── Quick tips card ── */}
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-2">
                  Review Guidelines
                </p>
                <ul className="text-xs text-blue-700 space-y-1.5">
                  <li>✓ Verify all questions have a correct answer marked</li>
                  <li>✓ Check options are distinct and unambiguous</li>
                  <li>✓ Confirm subject and section are correct</li>
                  <li>✓ Rejection reason is sent directly to the teacher</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
