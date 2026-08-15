import React, { useState } from 'react';
import { MOCK_SUBJECTS } from '../../data/mockData';
import { Plus, Trash2, Clock, CheckCircle2, Save, Send, HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Toaster, toast } from 'sonner';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

const ExamCreation = () => {
  const [examData, setExamData] = useState({
    title: '',
    subjectId: MOCK_SUBJECTS[0].id,
    duration: 60,
    instructions: '',
  });

  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', text: '', options: ['', '', '', ''], correctAnswer: 0 }
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { 
      id: Math.random().toString(36).substr(2, 9),
      text: '', 
      options: ['', '', '', ''], 
      correctAnswer: 0 
    }]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const updateOption = (qId: string, optIdx: number, text: string) => {
    setQuestions(questions.map(q => q.id === qId ? { 
      ...q, 
      options: q.options.map((opt, i) => i === optIdx ? text : opt) 
    } : q));
  };

  const setCorrectAnswer = (qId: string, idx: number) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, correctAnswer: idx } : q));
  };

  const handleSubmit = (status: 'draft' | 'pending') => {
    toast.success(status === 'draft' ? 'Exam saved as draft' : 'Exam submitted for admin review!');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Create New Examination</h2>
          <p className="text-gray-500 mt-1">Design your exam and questions. Results are auto-graded.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleSubmit('draft')}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-black text-gray-700 uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button 
            onClick={() => handleSubmit('pending')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20"
          >
            <Send className="w-4 h-4" />
            Submit for Review
          </button>
        </div>
      </div>

      {/* Exam Details Card */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Exam Title</label>
          <input
            type="text"
            placeholder="e.g. Mathematics Mid-Term Exam 2024"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-gray-900 transition-all placeholder:text-gray-300"
            value={examData.title}
            onChange={(e) => setExamData({ ...examData, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Subject</label>
          <select 
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-gray-900 appearance-none"
            value={examData.subjectId}
            onChange={(e) => setExamData({ ...examData, subjectId: e.target.value })}
          >
            {MOCK_SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Duration (Mins)</label>
          <div className="relative">
            <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="number"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-14 pr-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-gray-900"
              value={examData.duration}
              onChange={(e) => setExamData({ ...examData, duration: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            Exam Questions ({questions.length})
          </h3>
          <button 
            onClick={addQuestion}
            className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>

        {questions.map((question, qIdx) => (
          <div key={question.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden group">
            <div className="p-8 md:p-12">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-900 rounded-2xl flex items-center justify-center text-white font-black">
                    {qIdx + 1}
                  </div>
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Question Details</h4>
                </div>
                <button 
                  onClick={() => removeQuestion(question.id)}
                  className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-10">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-2">Question Text</label>
                <textarea
                  rows={2}
                  placeholder="Enter the question here..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-8 py-6 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-lg text-gray-900 resize-none transition-all placeholder:text-gray-200"
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, e.target.value)}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {question.options.map((option, oIdx) => (
                  <div 
                    key={oIdx}
                    className={cn(
                      "relative group/option rounded-3xl transition-all border-2",
                      question.correctAnswer === oIdx 
                        ? "bg-green-50 border-green-200" 
                        : "bg-gray-50 border-transparent hover:border-blue-100"
                    )}
                  >
                    <div className="flex items-center gap-4 p-4 pr-12">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors",
                        question.correctAnswer === oIdx ? "bg-green-600 text-white" : "bg-white text-gray-300"
                      )}>
                        {String.fromCharCode(65 + oIdx)}
                      </div>
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        className="bg-transparent border-none outline-none font-bold text-gray-900 w-full placeholder:text-gray-300"
                        value={option}
                        onChange={(e) => updateOption(question.id, oIdx, e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => setCorrectAnswer(question.id, oIdx)}
                      className={cn(
                        "absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        question.correctAnswer === oIdx ? "bg-green-600 text-white" : "bg-gray-200 text-transparent hover:bg-gray-300"
                      )}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="px-12 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Auto-Grading Active</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Marks:</span>
                <input 
                  type="number" 
                  defaultValue={10} 
                  className="w-12 bg-transparent border-none outline-none font-black text-blue-900 text-center"
                />
              </div>
            </div>
          </div>
        ))}
        
        <button 
          onClick={addQuestion}
          className="w-full py-12 bg-gray-50 border-4 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all group"
        >
          <div className="w-16 h-16 bg-white rounded-[2rem] shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8" />
          </div>
          <span className="text-sm font-black uppercase tracking-[0.2em]">Add Another Question</span>
        </button>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default ExamCreation;
