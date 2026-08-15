import React, { useState, useEffect } from 'react';
import { Exam } from '../../types';
import { Clock, AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Toaster, toast } from 'sonner';

interface ExamSessionProps {
  exam: Exam;
  onComplete: () => void;
}

const ExamSession = ({ exam, onComplete }: ExamSessionProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0 && !isSubmitted) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (option: string) => {
    if (isSubmitted) return;
    const questionId = exam.questions[currentQuestionIndex].id;
    setAnswers({ ...answers, [questionId]: option });
  };

  const handleSubmit = () => {
    if (isSubmitted) return;
    
    // Calculate score
    let correctCount = 0;
    exam.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / exam.questions.length) * 100);
    setScore(finalScore);
    setIsSubmitted(true);
    toast.success('Exam submitted successfully!');
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Exam Completed!</h2>
        <p className="text-gray-500 mb-8">Your results have been processed and recorded.</p>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Your Score</p>
              <p className="text-4xl font-black text-blue-900">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Total Marks</p>
              <p className="text-4xl font-black text-gray-300">100</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
              <TrendingUp className="w-5 h-5" />
              Passing Grade
            </div>
          </div>
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

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8 sticky top-20 bg-gray-50/80 backdrop-blur-md py-4 z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{exam.title}</h2>
          <p className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {exam.questions.length}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-white text-gray-700 shadow-sm border border-gray-200'}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to submit?')) handleSubmit();
            }}
            className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
          >
            Finish Exam
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 block">Question {currentQuestionIndex + 1}</span>
            <h3 className="text-2xl font-bold text-gray-900 leading-tight">
              {currentQuestion.text}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                className={`p-6 text-left rounded-2xl border-2 transition-all flex items-center justify-between group ${
                  answers[currentQuestion.id] === option
                    ? 'border-blue-600 bg-blue-50 text-blue-900' 
                    : 'border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-white text-gray-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    answers[currentQuestion.id] === option ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-400 group-hover:border-blue-200 group-hover:text-blue-600'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="font-semibold">{option}</span>
                </div>
                {answers[currentQuestion.id] === option && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 bg-gray-50 flex items-center justify-between border-t border-gray-100">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 text-gray-600 font-bold disabled:opacity-30"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>
          
          <div className="flex gap-2">
            {exam.questions.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-2 h-2 rounded-full ${
                  currentQuestionIndex === idx ? 'bg-blue-600 w-6' : 
                  answers[exam.questions[idx].id] !== undefined ? 'bg-blue-200' : 'bg-gray-300'
                } transition-all duration-300`}
              ></div>
            ))}
          </div>

          <button
            onClick={() => {
              if (currentQuestionIndex < exam.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
              } else {
                if (confirm('Finish and submit?')) handleSubmit();
              }
            }}
            className="flex items-center gap-2 text-blue-600 font-bold"
          >
            {currentQuestionIndex === exam.questions.length - 1 ? 'Finish' : 'Next Question'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Missing Import
const TrendingUp = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
);

export default ExamSession;
