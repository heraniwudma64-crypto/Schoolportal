import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Filter,
  RefreshCw,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../lib/api';

interface OptionReview {
  id: string;
  text: string;
  isCorrect: boolean;
  isSelected: boolean;
}

interface QuestionReview {
  questionNumber: number;
  questionId: string;
  questionText: string;
  maxMarks: number;
  earnedMarks: number;
  status: 'CORRECT' | 'INCORRECT' | 'UNANSWERED';
  studentAnswer: {
    optionId: string | null;
    optionText: string | null;
  };
  correctAnswer: {
    optionId: string | null;
    optionText: string | null;
  };
  options: OptionReview[];
}

interface ExamReviewPayload {
  exam: {
    id: string;
    title: string;
    totalMarks: number;
    duration: number;
    subjectName: string;
    subjectCode: string;
    classSection: string;
    resultsReleasedAt: string | null;
  };
  summary: {
    score: number;
    totalMarks: number;
    percentage: number;
    passed: boolean;
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    completedAt: string;
  };
  questions: QuestionReview[];
}

interface Props {
  examId: string;
  onClose: () => void;
}

export default function ExamReviewModal({ examId, onClose }: Props) {
  const [data, setData] = useState<ExamReviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MISSED' | 'CORRECT'>('ALL');

  const fetchReview = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get<ExamReviewPayload>(`/examinations/${examId}/review`);
      setData(res);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Exam review and correct answers have not been released by your teacher yet.',
      );
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const questions = data?.questions ?? [];
  const filteredQuestions = questions.filter((q) => {
    if (activeFilter === 'MISSED') return q.status === 'INCORRECT' || q.status === 'UNANSWERED';
    if (activeFilter === 'CORRECT') return q.status === 'CORRECT';
    return true;
  });

  const summary = data?.summary;
  const exam = data?.exam;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/30 text-blue-200 border border-blue-400/30">
                {exam?.subjectName ?? 'Exam Review'}
              </span>
              <span className="text-xs text-blue-200">
                {exam?.classSection ?? ''} &bull; Post-Exam Self Assessment
              </span>
            </div>
            <h2 className="text-2xl font-black">{exam?.title ?? 'Exam Review'}</h2>
            <p className="text-xs text-blue-200/80 mt-1">
              Review your submitted answers side-by-side with the correct answers.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-2xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
          {loading ? (
            <div className="py-24 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-gray-500">Loading your graded exam review...</p>
            </div>
          ) : errorMsg ? (
            <div className="py-16 px-6 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Review Not Available</h3>
              <p className="text-sm text-gray-600">{errorMsg}</p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-800 transition-colors"
              >
                Back to Exams
              </button>
            </div>
          ) : !data ? null : (
            <>
              {/* Score Banner */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div
                    className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black ${
                      summary?.passed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span className="text-2xl leading-none">{summary?.percentage}%</span>
                    <span className="text-[10px] uppercase tracking-wider mt-1">
                      {summary?.passed ? 'Passed' : 'Needs Review'}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Final Score</p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-black text-gray-900">{summary?.score}</span>
                      <span className="text-sm font-semibold text-gray-400">/ {summary?.totalMarks} marks</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Completed on {new Date(summary!.completedAt).toLocaleDateString()} at{' '}
                      {new Date(summary!.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Counter Pills */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-around md:justify-end">
                  <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                    <p className="text-lg font-black text-emerald-700">{summary?.correctCount}</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Correct</p>
                  </div>

                  <div className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-2xl text-center">
                    <p className="text-lg font-black text-rose-700">{summary?.incorrectCount}</p>
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Incorrect</p>
                  </div>

                  <div className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                    <p className="text-lg font-black text-amber-700">{summary?.unansweredCount}</p>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Skipped</p>
                  </div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Show:</span>
                  <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 text-xs font-bold shadow-sm">
                    <button
                      onClick={() => setActiveFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        activeFilter === 'ALL'
                          ? 'bg-blue-900 text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      All Questions ({questions.length})
                    </button>
                    <button
                      onClick={() => setActiveFilter('MISSED')}
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                        activeFilter === 'MISSED'
                          ? 'bg-rose-600 text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Missed Only ({(summary?.incorrectCount ?? 0) + (summary?.unansweredCount ?? 0)})
                    </button>
                    <button
                      onClick={() => setActiveFilter('CORRECT')}
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                        activeFilter === 'CORRECT'
                          ? 'bg-emerald-600 text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Correct ({summary?.correctCount ?? 0})
                    </button>
                  </div>
                </div>

                <span className="text-xs text-gray-500 font-semibold hidden sm:inline">
                  Showing {filteredQuestions.length} of {questions.length}
                </span>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {filteredQuestions.length === 0 ? (
                  <div className="py-12 text-center bg-white rounded-3xl border border-gray-100 p-8">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-gray-700">No questions in this filter.</p>
                    <p className="text-xs text-gray-400 mt-1">Select &ldquo;All Questions&rdquo; to see the entire exam.</p>
                  </div>
                ) : (
                  filteredQuestions.map((q) => {
                    const isCorrect = q.status === 'CORRECT';
                    const isUnanswered = q.status === 'UNANSWERED';

                    return (
                      <div
                        key={q.questionId}
                        className={`bg-white rounded-3xl p-6 md:p-7 border shadow-sm transition-all ${
                          isCorrect
                            ? 'border-emerald-200'
                            : isUnanswered
                            ? 'border-amber-200'
                            : 'border-rose-200'
                        }`}
                      >
                        {/* Question Card Header */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-gray-100 text-gray-700 font-black flex items-center justify-center text-sm">
                              {q.questionNumber}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                isCorrect
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isUnanswered
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isCorrect ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{q.earnedMarks} marks)
                                </>
                              ) : isUnanswered ? (
                                <>
                                  <AlertCircle className="w-3.5 h-3.5" /> Unanswered (0 / {q.maxMarks} marks)
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" /> Incorrect (0 / {q.maxMarks} marks)
                                </>
                              )}
                            </span>
                          </div>

                          <span className="text-xs text-gray-400 font-bold">
                            Worth {q.maxMarks} marks
                          </span>
                        </div>

                        {/* Question Text */}
                        <p className="text-base font-bold text-gray-900 mb-5 leading-relaxed">
                          {q.questionText}
                        </p>

                        {/* Options Side-by-Side / List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options.map((opt, optIdx) => {
                            const isUserPick = opt.isSelected;
                            const isCorrectAnswer = opt.isCorrect;

                            let optStyle = 'bg-gray-50/70 border-gray-200 text-gray-700';
                            let badge = null;

                            if (isCorrectAnswer) {
                              optStyle = 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold ring-1 ring-emerald-300';
                              badge = (
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white ml-auto shrink-0 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Correct Solution
                                </span>
                              );
                            }

                            if (isUserPick && !isCorrectAnswer) {
                              optStyle = 'bg-rose-50/90 border-rose-300 text-rose-950 font-semibold ring-1 ring-rose-300';
                              badge = (
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white ml-auto shrink-0 flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> Your Choice
                                </span>
                              );
                            } else if (isUserPick && isCorrectAnswer) {
                              badge = (
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-700 text-white ml-auto shrink-0 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Your Choice &bull; Correct
                                </span>
                              );
                            }

                            return (
                              <div
                                key={opt.id}
                                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${optStyle}`}
                              >
                                <span
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                    isCorrectAnswer
                                      ? 'bg-emerald-600 text-white'
                                      : isUserPick
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-white text-gray-500 border border-gray-200'
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="text-sm flex-1 leading-snug">{opt.text}</span>
                                {badge}
                              </div>
                            );
                          })}
                        </div>

                        {/* Missed feedback footer */}
                        {!isCorrect && (
                          <div className="mt-4 p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Self-Assessment Tip: </span>
                              {isUnanswered ? (
                                <span>
                                  You skipped this question during the exam. The correct answer was{' '}
                                  <strong className="text-emerald-800">
                                    &ldquo;{q.correctAnswer.optionText}&rdquo;
                                  </strong>.
                                </span>
                              ) : (
                                <span>
                                  You selected &ldquo;{q.studentAnswer.optionText}&rdquo;. The correct answer was{' '}
                                  <strong className="text-emerald-800">
                                    &ldquo;{q.correctAnswer.optionText}&rdquo;
                                  </strong>.
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 md:p-6 bg-white border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400 font-semibold">
            {summary?.passed ? 'Passing threshold met' : 'Review areas to strengthen before future assessments'}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
}
