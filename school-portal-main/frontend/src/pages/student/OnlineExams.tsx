import React, { useState } from 'react';
import { MOCK_EXAMS } from '../../data/mockData';
import { Badge } from '../../components/ui/badge';
import { FileText, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import ExamSession from './ExamSession';
import { Exam } from '../../types';

const OnlineExams = () => {
  const [activeExam, setActiveExam] = useState<Exam | null>(null);

  if (activeExam) {
    return <ExamSession exam={activeExam} onComplete={() => setActiveExam(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Online Examinations</h2>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
        <div>
          <h3 className="font-bold text-amber-900 mb-1">Important Examination Notice</h3>
          <p className="text-sm text-amber-800">
            Please ensure you have a stable internet connection before starting an exam. 
            Once started, the timer cannot be paused. Refreshing the page may result in automatic submission.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_EXAMS.filter(e => e.status === 'approved').map((exam) => (
          <div key={exam.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-blue-300 transition-all group">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-100 uppercase tracking-widest text-[10px]">
                  {exam.subjectName}
                </Badge>
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <Clock className="w-3 h-3" />
                  {exam.duration} mins
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{exam.title}</h3>
              <p className="text-sm text-gray-500 mb-6 line-clamp-2">{exam.subjectName} — {exam.duration} minute exam</p>

              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Questions</span>
                  <span className="text-sm font-bold text-gray-900">{exam.questions.length} items</span>
                </div>
                <button 
                  onClick={() => setActiveExam(exam)}
                  className="px-6 py-2 bg-blue-900 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-colors flex items-center gap-2"
                >
                  Start Exam
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineExams;
