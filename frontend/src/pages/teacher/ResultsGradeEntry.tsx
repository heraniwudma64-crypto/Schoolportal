import React, { useState, useEffect, useMemo } from 'react';
import { Search, Save, Calculator, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Toaster, toast } from 'sonner';
import { api } from '../../lib/api'; // Import your authenticated api client
import { formatClassSection } from '../../lib/classSection';
import { getEnrolledStudents } from '../../api/roster';

const ResultsGradeEntry = () => {
  const [selectedQuarter, setSelectedQuarter] = useState('Quarter 1');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teachingAssignments, setTeachingAssignments] = useState<any[]>([]);
  const selectedAssignment = useMemo(
    () => teachingAssignments.find((assignment) => assignment.id === selectedAssignmentId) ?? null,
    [selectedAssignmentId, teachingAssignments],
  );

  // Fetch real enrolled students dynamically using your api client and section endpoint
  useEffect(() => {
    api.get<any[]>('/teachers/assignments').then((assignments) => {
      setTeachingAssignments(assignments);
      if (assignments[0]) {
        setSelectedAssignmentId(assignments[0].id);
      }
    }).catch(() => toast.error('Could not load your active class-subject assignments'));
  }, []);

  useEffect(() => {
    async function fetchStudents() {
      if (!selectedAssignment) {
        setGrades([]);
        return;
      }
      setLoading(true);
      try {
        const data = await getEnrolledStudents(selectedAssignment.academicYearId, selectedAssignment.classSectionId);
        
        const rawList = data;

        if (rawList.length > 0) {
          const formattedData = rawList.map((student: any) => ({
            id: student.id,
            name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student',
            mid: 0,
            assignment: 0,
            quiz: 0,
            classwork: 0,
            final: 0,
          }));
          setGrades(formattedData);
        } else {
          // Empty state if the section has no registered students yet
          setGrades([]);
          toast.info(`No students found enrolled in ${formatClassSection(selectedAssignment.ClassSection)}`);
        }
      } catch (err) {
        console.error('Failed to fetch students from server:', err);
        toast.error('Could not load students for this class.');
        setGrades([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, [selectedAssignment]);

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
    if (!selectedAssignment) {
      toast.error('Select one of your active class-subject assignments');
      return;
    }
    setSaving(true);
    try {
      const savePromises = grades.map((studentGrade) =>
        api.post('/grades', {
          studentId: studentGrade.id,
          subjectId: selectedAssignment.subjectId,
          quarter: selectedQuarter,
          mid: studentGrade.mid,
          assignment: studentGrade.assignment,
          quiz: studentGrade.quiz,
          classwork: studentGrade.classwork,
          final: studentGrade.final,
          score: calculateTotal(studentGrade),
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

  const submitToHomeroom = async () => {
    if (!selectedAssignment) return toast.error('Select one of your active class-subject assignments');
    try {
      await api.post('/results/submit-to-homeroom', { 
        classSectionId: selectedAssignment.classSectionId,
        subjectId: selectedAssignment.subjectId,
        academicYearId: selectedAssignment.academicYearId,
        term: selectedQuarter.replace('Quarter ', 'TERM_'),
      });
      toast.success('Finalized results sent to the homeroom teacher');
    } catch (error: any) { toast.error(error.message || 'Could not submit results'); }
  };

  const saveDraft = async (studentId?: string) => {
    if (!selectedAssignment) return toast.error('Select one of your active class-subject assignments');
    const selectedGrades = studentId ? grades.filter((grade) => grade.id === studentId) : grades;
    try {
      await api.post('/results/draft', { classSectionId: selectedAssignment.classSectionId, subjectId: selectedAssignment.subjectId, academicYearId: selectedAssignment.academicYearId, term: selectedQuarter.replace('Quarter ', 'TERM_'), grades: selectedGrades.map((grade) => ({ studentId: grade.id, marks: calculateTotal(grade) })) });
      if (studentId) await api.post('/results/publish-student', { classSectionId: selectedAssignment.classSectionId, subjectId: selectedAssignment.subjectId, academicYearId: selectedAssignment.academicYearId, term: selectedQuarter.replace('Quarter ', 'TERM_'), studentId });
      toast.success(studentId ? 'Student result published' : 'Class results saved as draft');
    } catch (error: any) { toast.error(error.message || 'Could not save results'); }
  };

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
        <div className="flex gap-2 items-center">
            <button 
            onClick={() => saveDraft()}
            disabled={saving || grades.length === 0 || !selectedAssignment}
            className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Publishing...' : 'Save Class Results'}
          </button>
          <button onClick={submitToHomeroom} disabled={saving || grades.length === 0 || !selectedAssignment} className="flex items-center gap-2 px-4 py-2 border border-blue-900 text-blue-900 rounded-xl text-sm font-bold disabled:opacity-50">Send to Homeroom</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Assigned Class & Subject</label>
          <select 
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Select an assigned class and subject</option>
            {teachingAssignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {formatClassSection(assignment.ClassSection)} — {assignment.Subject.name}
              </option>
            ))}
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 font-medium">
                    Loading enrolled students for {selectedAssignment ? formatClassSection(selectedAssignment.ClassSection) : 'your selected assignment'}...
                  </td>
                </tr>
              ) : filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400 font-medium">
                    No students found for this class section.
                  </td>
                </tr>
              ) : (
                filteredGrades.map((grade) => (
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
                      <button onClick={() => saveDraft(grade.id)} className="ml-2 text-xs font-bold text-blue-800">Publish</button>
                    </td>
                  </tr>
                ))
              )}
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
