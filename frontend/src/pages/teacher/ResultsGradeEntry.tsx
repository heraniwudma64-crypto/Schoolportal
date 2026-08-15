import React, { useState } from 'react';
import { MOCK_SUBJECTS } from '../../data/mockData';
import { GraduationCap, Search, Save, Calculator, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Toaster, toast } from 'sonner';

const ResultsGradeEntry = () => {
  const [selectedClass, setSelectedClass] = useState('Grade 10A');
  const [selectedSubject, setSelectedSubject] = useState(MOCK_SUBJECTS[0].id);
  const [grades, setGrades] = useState([
    { id: '1', name: 'Abebe Kebede', mid: 15, assignment: 18, quiz: 8, classwork: 9, final: 35 },
    { id: '2', name: 'Tigist Haile', mid: 14, assignment: 16, quiz: 7, classwork: 8, final: 32 },
  ]);

  const handleGradeChange = (id: string, field: string, value: string) => {
    const numValue = Math.min(Number(value) || 0, field === 'final' ? 40 : field === 'quiz' || field === 'classwork' ? 10 : 20);
    setGrades(grades.map(g => g.id === id ? { ...g, [field]: numValue } : g));
  };

  const calculateTotal = (grade: any) => {
    return grade.mid + grade.assignment + grade.quiz + grade.classwork + grade.final;
  };

  const handleSave = () => {
    toast.success('Grades saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Academic Grade Entry</h2>
          <p className="text-sm text-gray-500">Enter student scores for each grading component.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20"
          >
            <Save className="w-4 h-4" />
            Publish Results
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Quarter</label>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20">
            <option>Quarter 1</option>
            <option>Quarter 2</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Class</label>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option>Grade 10A</option>
            <option>Grade 10B</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Subject</label>
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {MOCK_SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Name or ID..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

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
              {grades.map((grade) => (
                <tr key={grade.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{grade.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold">STD-00{grade.id}</p>
                  </td>
                  {['mid', 'assignment', 'quiz', 'classwork', 'final'].map((field) => (
                    <td key={field} className="px-6 py-4">
                      <div className="flex justify-center">
                        <input
                          type="number"
                          value={grade[field as keyof typeof grade]}
                          onChange={(e) => handleGradeChange(grade.id, field, e.target.value)}
                          className="w-16 text-center bg-gray-50 border border-gray-100 rounded-lg py-2 text-sm font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      "inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-full text-sm font-black",
                      calculateTotal(grade) >= 90 ? "bg-green-100 text-green-700" :
                      calculateTotal(grade) >= 70 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {calculateTotal(grade)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center text-white">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900">Auto-Calculate Semester Average</p>
            <p className="text-xs text-blue-600">The system will automatically calculate SEM 1 and SEM 2 averages based on these results.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 text-sm font-black text-blue-900 uppercase tracking-widest hover:underline">
          Recalculate All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default ResultsGradeEntry;
