import React, { useState } from 'react';
import { MOCK_EXAMS } from '../../data/mockData';
import { Badge } from '../../components/ui/badge';
import { FileCheck, Eye, CheckCircle2, XCircle, MessageSquare, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Toaster, toast } from 'sonner';
import { Exam, ExamQuestion } from '../../types';

const ExamReviewApproval = () => {
  const [exams, setExams] = useState<Exam[]>(MOCK_EXAMS.map(e => e.id === 'e1' ? { ...e, status: 'pending_approval' as const } : e));
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [remarks, setRemarks] = useState('');
  const handleStatusUpdate = (id: string, status: 'approved' | 'rejected') => {
    setExams(exams.map(e => e.id === id ? { ...e, status, adminRemarks: remarks } : e));
    toast.success(`Exam ${status === 'approved' ? 'approved and published' : 'rejected'} successfully!`);
    setSelectedExam(null);
    setRemarks('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Exam Review Panel</h2>
          <p className="text-sm text-gray-500">Quality control and approval for teacher-submitted examinations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {exams.filter(e => e.status === 'pending_approval').length === 0 ? (
            <div className="bg-white p-12 rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-green-50 rounded-[2rem] flex items-center justify-center text-green-600 mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Queue is Clear!</h3>
              <p className="text-gray-500">All submitted exams have been reviewed and processed.</p>
            </div>
          ) : (
            exams.filter(e => e.status === 'pending_approval').map((exam) => (
              <div 
                key={exam.id} 
                className={cn(
                  "bg-white p-8 rounded-[2rem] shadow-sm border-2 transition-all cursor-pointer",
                  selectedExam?.id === exam.id ? "border-blue-900 ring-4 ring-blue-500/10" : "border-transparent hover:border-gray-200"
                )}
                onClick={() => setSelectedExam(exam)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                      <FileCheck className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-gray-900">{exam.title}</h3>
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest">Pending Review</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">Submitted by <span className="font-bold text-gray-900">{exam.teacherName}</span> • {exam.subjectName}</p>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <Clock className="w-3 h-3" />
                          {exam.duration} Mins
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <MessageSquare className="w-3 h-3" />
                          {exam.questions.length} Questions
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-gray-50 text-blue-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-900 hover:text-white transition-all flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Review Content
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 sticky top-6">
            <h3 className="text-lg font-black text-gray-900 mb-6">Decision Center</h3>
            {selectedExam ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Exam Content Preview</label>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {selectedExam.questions.map((q: ExamQuestion, idx: number) => (
                      <div key={q.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-sm font-bold text-gray-900 mb-3">
                          <span className="text-blue-900 mr-2">Q{idx + 1}.</span>
                          {q.text}
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {q.options.map((opt: string) => (
                            <div key={opt} className={cn(
                              "px-4 py-2 rounded-xl text-xs font-medium border transition-all",
                              opt === q.correctAnswer ? "bg-green-50 border-green-200 text-green-700" : "bg-white border-gray-100 text-gray-500"
                            )}>
                              {opt} {opt === q.correctAnswer && "✓"}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Review Remarks</label>
                  <textarea
                    rows={4}
                    placeholder="Add feedback for the teacher..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium text-sm transition-all resize-none"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleStatusUpdate(selectedExam.id, 'rejected')}
                    className="flex flex-col items-center justify-center p-6 bg-red-50 text-red-600 rounded-2xl border-2 border-transparent hover:border-red-600 transition-all gap-2"
                  >
                    <XCircle className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Reject</span>
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedExam.id, 'approved')}
                    className="flex flex-col items-center justify-center p-6 bg-green-50 text-green-600 rounded-2xl border-2 border-transparent hover:border-green-600 transition-all gap-2"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Approve</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">
                <p className="text-sm italic">Select an exam from the list to begin review.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default ExamReviewApproval;
