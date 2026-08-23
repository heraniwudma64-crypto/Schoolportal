import React, { useState, useEffect } from 'react';
import { MOCK_SUBJECTS } from '../../data/mockData';
import { GraduationCap, Search, Save, Calculator, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Toaster, toast } from 'sonner';

const ResultsGradeEntry = () => {
  const [selectedQuarter, setSelectedQuarter] = useState('Quarter 1');
  const [selectedClass, setSelectedClass] = useState('Grade 10A');
  const [selectedSubject, setSelectedSubject] = useState(MOCK_SUBJECTS[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch students dynamically when class changes
 useEffect(() => {
  fetch(`http://localhost:3000/students?className=${encodeURIComponent(selectedClass)}`)
    .then((res) => {
      if (!res.ok) throw new Error('API route not found or failed');
      return res.json();
    })
    .then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        const formattedData = data.map((student: any) => ({
          id: student.id,
          name: student.name || `${student.firstName} ${student.lastName}`,
          mid: 0,
          assignment: 0,
          quiz: 0,
          classwork: 0,
          final: 0,
        }));
        setGrades(formattedData);
      } else {
        // Fallback demo data if no students are returned from database
        setGrades([
          { id: '1', name: 'Abebe Kebede', mid: 15, assignment: 18, quiz: 8, classwork: 9, final: 35 },
          { id: '2', name: 'Tigist Haile', mid: 14, assignment: 16, quiz: 7, classwork: 8, final: 32 },
        ]);
      }
    })
    .catch((err) => {
      console.warn('Using fallback mock data due to API error:', err);
      // Fallback demo data so your page renders fine while testing
      setGrades([
        { id: '1', name: 'Abebe Kebede', mid: 15, assignment: 18, quiz: 8, classwork: 9, final: 35 },
        { id: '2', name: 'Tigist Haile', mid: 14, assignment: 16, quiz: 7, classwork: 8, final: 32 },
      ]);
    });
}, [selectedClass]);

  const handleGradeChange = (id: string, field: string, value: string) => {
    const rawVal = Number(value);
    const maxLimit = field === 'final' ? 40 : field === 'quiz' || field === 'classwork' ? 10 : 20;
    const numValue = Math.min(Math.max(rawVal || 0, 0), maxLimit);

    setGrades(grades.map(g => g.id === id ? { ...g, [field]: numValue } : g));
  };

  const calculateTotal = (grade: any) => {
    return (grade.mid || 0) + (grade.assignment || 0) + (grade.quiz || 0) + (grade.classwork || 0) + (grade.final || 0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Loop and post scores for each student to your NestJS backend
      const savePromises = grades.map((studentGrade) =>
        fetch('http://localhost:3000/grades', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            studentId: studentGrade.id,
            subjectId: selectedSubject,
            quarter: selectedQuarter,
            mid: studentGrade.mid,
            assignment: studentGrade.assignment,
            quiz: studentGrade.quiz,
            classwork: studentGrade.classwork,
            final: studentGrade.final,
            score: calculateTotal(studentGrade),
          }),
        })
      );

      await Promise.all(savePromises);
      toast.success('Results published and saved successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save grades. Check backend server connection.');
    } finally {
      setSaving(false);
    }
  };

  // Filter list based on search query
  const filteredGrades = grades.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Academic Grade Entry</h2>
          <p className="text-sm text-gray-500">Enter student scores for each grading component and publish results.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Publishing...' : 'Publish Results'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Quarter</label>
          <select 
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option>Quarter 1</option>
            <option>Quarter 2</option>
            <option>Quarter 3</option>
            <option>Quarter 4</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Class</label>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="Grade 10A">Grade 10A</option>
            <option value="Grade 10B">Grade 10B</option>
            <option value="Grade 11A">Grade 11A</option>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
  {filteredGrades.map((grade) => (
    <tr key={grade.id} className="hover:bg-gray-50/50 transition-colors">
      <td className="px-6 py-4">
        <p className="text-sm font-bold text-gray-900">{grade.name}</p>
        <p className="text-[10px] text-gray-400 font-bold">ID: {grade.id}</p>
      </td>
      {['mid', 'assignment', 'quiz', 'classwork', 'final'].map((field) => (
        <td key={field} className="px-6 py-4">
          <div className="flex justify-center">
            <input
              type="number"
              value={grade[field]}
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
            <p className="text-xs text-blue-600">The system automatically tallies component inputs and updates student ledger records.</p>
          </div>
        </div>
        <button 
          onClick={() => toast.info('All grade points recalculated.')}
          className="flex items-center gap-2 text-sm font-black text-blue-900 uppercase tracking-widest hover:underline cursor-pointer"
        >
          Recalculate All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default ResultsGradeEntry;