/**
 * ExamSession — live exam-taking screen.
 *
 * Responsibilities:
 *  • Accepts live exam data (questions without isCorrect) from OnlineExams
 *  • Renders one question at a time with progress dots
 *  • Periodic auto-save to localStorage AND backend every 15 s
 *  • Server-authoritative timer (timeRemainingSeconds from backend session)
 *  • Auto-submits on timer expiry
 *  • Final-submit calls POST /:examId/session/submit and shows score screen
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock, CheckCircle2, ArrowRight, ArrowLeft, AlertTriangle,
  Save, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiveOption {
  id: string;
  optionText: string;
}

export interface LiveQuestion {
  id: string;
  text: string;
  options: LiveOption[];
}

/** Shape returned by POST /:examId/session/start */
export interface LiveExamData {
  sessionToken: string;
  timeRemainingSeconds: number;
  resumedAt: string | null;
  answers: Record<string, string>; // { [questionId]: selectedOptionId }
  questions: LiveQuestion[];
  serverNow: string;
}

interface ExamSessionProps {
  exam: {
    id: string;
    title: string;
    duration: number;
    subject: { id: string; name: string } | null;
    questionCount: number;
  };
  liveData: LiveExamData;
  onComplete: () => void;
}

interface GradingResult {
  success: boolean;
  score: number;
  totalMarks: number;
  percentage: number;
  sessionStatus: string;
}

// ─── Local storage key helpers ─────────────────────────────────────────────────

const lsKey = (examId: string) => `exam_session_${examId}`;

function loadLocalProgress(examId: string): Partial<LiveExamData> | null {
  try {
    const raw = localStorage.getItem(lsKey(examId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalProgress(examId: string, answers: Record<string, string>, timeRemaining: number) {
  try {
    localStorage.setItem(lsKey(examId), JSON.stringify({ answers, timeRemaining }));
  } catch {
    // quota exceeded — ignore
  }
}

function clearLocalProgress(examId: string) {
  try { localStorage.removeItem(lsKey(examId)); } catch { /* */ }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExamSession({ exam, liveData, onComplete }: ExamSessionProps) {
  const questions = liveData.questions;
  const totalQ = questions.length;

  // Merge server answers with any locally-cached draft answers
  const localCache = loadLocalProgress(exam.id);
  const initialAnswers: Record<string, string> = {
    ...(localCache?.answers ?? {}),
    ...liveData.answers, // server answers win
  };

  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(liveData.timeRemainingSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);

  const sessionTokenRef = useRef(liveData.sessionToken);
  const answersRef = useRef(answers);
  const timeLeftRef = useRef(timeLeft);
  const submittedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  // ── Timer ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (result) return; // already finished
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          // Auto-submit on expiry
          if (!submittedRef.current) {
            submittedRef.current = true;
            submitExam('auto');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // ── Auto-save every 15 s ────────────────────────────────────────────────────

  const doSave = useCallback(async () => {
    const currentAnswers = answersRef.current;
    const currentTime = timeLeftRef.current;

    // Always save locally first (works offline)
    saveLocalProgress(exam.id, currentAnswers, currentTime);

    // Then try the backend
    try {
      setIsSaving(true);
      await api.post(`/examinations/${exam.id}/session/save`, {
        sessionToken: sessionTokenRef.current,
        answers: currentAnswers,
        timeRemainingSeconds: currentTime,
      });
    } catch {
      // Non-fatal — local save already succeeded
    } finally {
      setIsSaving(false);
    }
  }, [exam.id]);

  useEffect(() => {
    if (result) return;
    const id = setInterval(doSave, 15_000);
    return () => clearInterval(id);
  }, [doSave, result]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submitExam = useCallback(
    async (trigger: 'manual' | 'auto') => {
      if (submittedRef.current && trigger === 'manual') return;
      if (trigger === 'manual') {
        submittedRef.current = true;
      }
      setIsSubmitting(true);
      try {
        const res = await api.post<GradingResult>(`/examinations/${exam.id}/session/submit`, {
          sessionToken: sessionTokenRef.current,
          answers: answersRef.current,
        });
        clearLocalProgress(exam.id);
        setResult(res);
        toast.success('Exam submitted successfully!');
      } catch (err: any) {
        const msg: string = err?.message ?? 'Submission failed';
        toast.error(msg);
        // If we're on auto-submit, the window closed — don't leave student stuck
        if (trigger === 'auto') {
          clearLocalProgress(exam.id);
          onComplete();
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [exam.id, onComplete],
  );

  const handleManualSubmit = () => {
    const unanswered = questions.filter((q) => !answers[q.id]).length;
    const msg =
      unanswered > 0
        ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`
        : 'Submit the exam? You cannot change answers after this.';
    if (!window.confirm(msg)) return;
    submitExam('manual');
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const answeredCount = questions.filter((q) => answers[q.id]).length;

  // ─────────────────────────────────────────────────────────────────────────────
  // RESULTS SCREEN
  // ─────────────────────────────────────────────────────────────────────────────

  if (result) {
    const passed = result.percentage >= 60;
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-2 ${
            passed ? 'bg-green-100' : 'bg-red-100'
          }`}
        >
          {passed
            ? <CheckCircle2 className="w-12 h-12 text-green-600" />
            : <AlertTriangle className="w-12 h-12 text-red-500" />}
        </div>

        <h2 className="text-3xl font-black text-gray-900">
          {passed ? 'Exam Completed!' : 'Exam Submitted'}
        </h2>
        <p className="text-gray-500">
          {passed ? 'Great work — your results have been recorded.' : 'Your answers have been submitted.'}
        </p>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Score</p>
            <p className="text-4xl font-black text-blue-900">{result.score}</p>
            <p className="text-xs text-gray-400 mt-1">out of {result.totalMarks}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Percentage</p>
            <p className={`text-4xl font-black ${passed ? 'text-green-600' : 'text-red-500'}`}>
              {result.percentage}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Answered</p>
            <p className="text-4xl font-black text-gray-700">
              {answeredCount}/{totalQ}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-500">
          <TrendingUp className="w-4 h-4" />
          {passed ? 'Passing grade achieved' : 'Below passing threshold (60%)'}
        </div>

        <button
          onClick={onComplete}
          className="px-8 py-3 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors"
        >
          Back to Exams
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EXAM SCREEN
  // ─────────────────────────────────────────────────────────────────────────────

  const currentQ = questions[currentIdx];
  const isUrgent = timeLeft <= 300; // 5 min warning

  return (
    <div className="max-w-4xl mx-auto pb-16">

      {/* ── Sticky header bar ── */}
      <div className="flex items-center justify-between mb-8 sticky top-20 bg-gray-50/90 backdrop-blur-md py-4 z-10 rounded-2xl px-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 leading-tight">{exam.title}</h2>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">
            Question {currentIdx + 1} of {totalQ}
            {liveData.resumedAt && (
              <span className="ml-2 text-amber-600">▶ Resumed</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-save indicator */}
          {isSaving && (
            <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
              <Save className="w-3 h-3" /> saving…
            </span>
          )}

          {/* Timer */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-black text-sm ${
              isUrgent
                ? 'bg-red-50 text-red-600 animate-pulse ring-1 ring-red-300'
                : 'bg-white text-gray-700 shadow-sm border border-gray-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>

          {/* Submit button */}
          <button
            onClick={handleManualSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting…' : 'Finish Exam'}
          </button>
        </div>
      </div>

      {/* ── Question card ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 md:p-12">

          <div className="mb-10">
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 block">
              Question {currentIdx + 1}
            </span>
            <h3 className="text-xl font-bold text-gray-900 leading-snug">{currentQ.text}</h3>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-4">
            {currentQ.options.map((opt, i) => {
              const isSelected = answers[currentQ.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: opt.id }))}
                  className={`p-5 text-left rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-white text-gray-700'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shrink-0 transition-colors ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-400'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="font-semibold">{opt.optionText}</span>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Navigation bar ── */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 text-gray-600 font-bold disabled:opacity-30 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" /> Previous
          </button>

          {/* Progress dots */}
          <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(i)}
                className={`rounded-full transition-all ${
                  i === currentIdx ? 'w-5 h-2.5 bg-blue-600' :
                  answers[q.id] ? 'w-2.5 h-2.5 bg-blue-300' :
                  'w-2.5 h-2.5 bg-gray-300'
                }`}
                title={`Q${i + 1}${answers[q.id] ? ' ✓' : ''}`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              if (currentIdx < totalQ - 1) {
                setCurrentIdx((p) => p + 1);
              } else {
                handleManualSubmit();
              }
            }}
            className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-900"
          >
            {currentIdx === totalQ - 1 ? 'Finish' : 'Next'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Answered progress footer ── */}
      <div className="mt-4 text-center text-xs text-gray-400 font-semibold">
        {answeredCount} of {totalQ} questions answered
        {answeredCount < totalQ && (
          <span className="ml-2 text-amber-600">· {totalQ - answeredCount} remaining</span>
        )}
      </div>
    </div>
  );
}
