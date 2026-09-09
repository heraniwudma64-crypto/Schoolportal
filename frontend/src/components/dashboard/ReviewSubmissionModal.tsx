import React, { useState, useEffect } from 'react';
import { X, FileText, Download, CheckCircle2, User, Calendar, Award, BookOpen } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export interface SubmissionReviewData {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  subject: string;
  targetClass?: string;
  instructions?: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  submittedAt: string;
  content: string | null;
  fileName: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  isGraded?: boolean;
  grade?: { score: number; maxScore: number } | null;
}

interface ReviewSubmissionModalProps {
  submission: SubmissionReviewData | null;
  isOpen: boolean;
  onClose: () => void;
  onGraded?: (submissionId: string, score: number, maxScore: number) => void;
}

export default function ReviewSubmissionModal({
  submission,
  isOpen,
  onClose,
  onGraded,
}: ReviewSubmissionModalProps) {
  const queryClient = useQueryClient();
  const [score, setScore] = useState<string>('');
  const [maxScore, setMaxScore] = useState<string>('100');
  const [savingGrade, setSavingGrade] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (submission) {
      if (submission.grade) {
        setScore(String(submission.grade.score));
        setMaxScore(String(submission.grade.maxScore || 100));
      } else {
        setScore('');
        setMaxScore('100');
      }
    }
  }, [submission]);

  if (!isOpen || !submission) return null;

  const handleDownloadFile = async () => {
    setDownloading(true);
    try {
      const res = await api.get<{ url: string }>(`/assignments/submissions/${submission.id}/file`);
      if (res?.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('File URL could not be resolved');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Could not download submission file');
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    const numScore = Number(score);
    const numMax = Number(maxScore || 100);

    if (isNaN(numScore) || numScore < 0) {
      return toast.error('Please enter a valid numeric score (0 or higher)');
    }
    if (isNaN(numMax) || numMax <= 0) {
      return toast.error('Please enter a valid maximum score');
    }

    setSavingGrade(true);
    try {
      await api.post(`/assignments/submissions/${submission.id}/grade`, {
        score: numScore,
        maxScore: numMax,
      });
      toast.success('Grade saved successfully');
      if (onGraded) {
        onGraded(submission.id, numScore, numMax);
      }
      queryClient.invalidateQueries({ queryKey: ['teachers', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save grade');
    } finally {
      setSavingGrade(false);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    return `${(bytes / 1024 / 1024).toFixed(bytes >= 1024 * 1024 ? 1 : 2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
              {submission.subject} {submission.targetClass ? `• ${submission.targetClass}` : ''}
            </span>
            <h2 className="text-lg font-bold text-gray-900 mt-1">
              {submission.assignmentTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Student Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{submission.studentName}</p>
                <p className="text-xs text-gray-500">Student ID: {submission.admissionNo}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Submitted: {new Date(submission.submittedAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Assignment Instructions if available */}
          {submission.instructions && (
            <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Assignment Prompt / Instructions
              </p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{submission.instructions}</p>
            </div>
          )}

          {/* Student Written Answer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Student's Written Answer
              </h3>
              {submission.content ? (
                <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  Response Provided
                </span>
              ) : (
                <span className="text-[11px] text-gray-400">No written text</span>
              )}
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
              {submission.content?.trim() ? (
                submission.content
              ) : (
                <p className="text-gray-400 italic">The student submitted an attached file without additional written text.</p>
              )}
            </div>
          </div>

          {/* Attached File (if any) */}
          {submission.fileName && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Attached File
              </h3>
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white hover:border-blue-300 transition">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-gray-900 truncate">{submission.fileName}</p>
                    {submission.fileSize ? (
                      <p className="text-xs text-gray-400">{formatFileSize(submission.fileSize)}</p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadFile}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold shrink-0 disabled:opacity-50 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloading ? 'Opening…' : 'Open / Download'}
                </button>
              </div>
            </div>
          )}

          {/* Grading & Feedback Section */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 mb-3">
              <Award className="w-4 h-4 text-amber-500" />
              Grade & Evaluation
            </h3>
            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Score Obtained</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="e.g. 85"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Max Score</label>
                  <input
                    type="number"
                    min="1"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    placeholder="100"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-gray-500">
                  {submission.isGraded || submission.grade ? (
                    <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Previously graded: {submission.grade?.score}/{submission.grade?.maxScore}
                    </span>
                  ) : (
                    'Not graded yet'
                  )}
                </span>
                <button
                  type="submit"
                  disabled={savingGrade}
                  className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition shadow-sm"
                >
                  {savingGrade ? 'Saving…' : 'Save Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
