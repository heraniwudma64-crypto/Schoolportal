import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, FileCheck, Printer, X, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAcademicYears, getGradeLevels } from '../../api/academicStructure';
import { getTermsForReportCards, getStudentsForReportCards, getReportCard, ReportCardResponse } from '../../api/reportCards';
import { cn } from '../../lib/utils';
import { useOutletContext } from 'react-router-dom';

const AdminReportCards = () => {
  const { searchQuery: globalSearchQuery } = useOutletContext<{ searchQuery: string }>();
  const [localSearch, setLocalSearch] = useState('');
  
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [gradeLevelId, setGradeLevelId] = useState<string>('');
  const [classSectionId, setClassSectionId] = useState<string>('');
  const [termId, setTermId] = useState<string>('');
  
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Filter Queries
  const { data: academicYears = [] } = useQuery({ queryKey: ['academicYears'], queryFn: getAcademicYears });
  const { data: gradeLevels = [] } = useQuery({ queryKey: ['gradeLevels'], queryFn: getGradeLevels });

  const selectedGrade = gradeLevels.find(g => g.id === gradeLevelId);
  const sections = selectedGrade?.ClassSection || [];

  const { data: terms = [] } = useQuery({
    queryKey: ['reportCardTerms', academicYearId],
    queryFn: () => getTermsForReportCards(academicYearId),
    enabled: !!academicYearId
  });
  
  const { data: students = [], isLoading: loadingStudents, refetch } = useQuery({
    queryKey: ['reportCardStudents', classSectionId, localSearch],
    queryFn: () => getStudentsForReportCards(classSectionId, localSearch),
    enabled: !!classSectionId
  });

  const { data: reportCard, isLoading: loadingReport } = useQuery({
    queryKey: ['reportCard', selectedStudentId, classSectionId, termId],
    queryFn: () => getReportCard(selectedStudentId!, classSectionId, termId),
    enabled: !!selectedStudentId && !!classSectionId && !!termId
  });

  // Set default Academic Year
  React.useEffect(() => {
    if (!academicYearId && academicYears.length > 0) {
      const current = academicYears.find(y => y.isCurrent) || academicYears[0];
      setAcademicYearId(current.id);
    }
  }, [academicYears, academicYearId]);

  const effectiveSearch = localSearch || globalSearchQuery || '';
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!effectiveSearch) return students;
    const q = effectiveSearch.toLowerCase();
    return students.filter(s => 
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.admissionNo.toLowerCase().includes(q)
    );
  }, [students, effectiveSearch]);

  const handleViewReport = (studentId: string) => {
    if (!termId) {
      alert("Please select a Term first to generate the report card.");
      return;
    }
    setSelectedStudentId(studentId);
    setIsReportModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Report Cards</h2>
          <p className="text-sm text-gray-500">Generate and print student report cards dynamically.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-900 hover:bg-blue-50 transition-all">
            <RefreshCw className={cn('w-4 h-4', loadingStudents && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Academic Year</label>
          <select value={academicYearId} onChange={e => { setAcademicYearId(e.target.value); setTermId(''); }} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all">
            <option value="">Select Year</option>
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Term</label>
          <select value={termId} onChange={e => setTermId(e.target.value)} disabled={!academicYearId} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all disabled:opacity-50">
            <option value="">Select Term</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Grade Level</label>
          <select value={gradeLevelId} onChange={e => { setGradeLevelId(e.target.value); setClassSectionId(''); }} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all">
            <option value="">Select Grade</option>
            {gradeLevels.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Class Section</label>
          <select value={classSectionId} onChange={e => setClassSectionId(e.target.value)} disabled={!gradeLevelId} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all disabled:opacity-50">
            <option value="">Select Section</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden print:hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or admission no..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-16">#</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gender</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingStudents ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-3 text-sm text-gray-500 font-bold">Loading students...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => {
                  const initials = student.firstName.charAt(0) + student.lastName.charAt(0);
                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-bold text-gray-400">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-blue-900/5 rounded-xl flex items-center justify-center text-blue-900 font-black text-sm flex-shrink-0">
                              {initials}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-black text-gray-900">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-gray-400">{student.admissionNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{student.gender || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleViewReport(student.id)}
                          disabled={!termId}
                          className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
                        >
                          <FileCheck className="w-4 h-4" /> View Report
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <FileCheck className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm font-bold text-gray-900">No students found</p>
                      <p className="text-xs mt-1 max-w-sm mx-auto">
                        {!classSectionId 
                          ? "Please select filters to view students."
                          : "No students are currently enrolled in this section."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Card Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm print:static print:bg-transparent print:p-0 print:backdrop-blur-none">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col print:shadow-none print:max-h-none print:overflow-visible">
            
            {/* Modal Header - Hidden on print */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 print:hidden">
              <h3 className="text-xl font-black text-gray-900">Student Report Card</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrint}
                  disabled={loadingReport || !reportCard}
                  className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50"
                  title="Print Report"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={() => setIsReportModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-8 print:p-0">
              {loadingReport ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 font-bold text-gray-500">Generating Report Card...</p>
                </div>
              ) : reportCard ? (
                <div className="space-y-8 bg-white" id="printable-report">
                  {/* Header */}
                  <div className="text-center border-b-2 border-blue-900 pb-6">
                    <h1 className="text-3xl font-black text-blue-900 uppercase tracking-widest">Mentor Academy</h1>
                    <p className="text-gray-500 mt-1 font-medium tracking-wide">Official Student Report Card</p>
                  </div>

                  {/* Student & Academic Info */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Student Information</h4>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <span className="font-bold text-gray-500">Name:</span>
                        <span className="col-span-2 font-black text-gray-900">{reportCard.student.firstName} {reportCard.student.lastName}</span>
                        
                        <span className="font-bold text-gray-500">Admission No:</span>
                        <span className="col-span-2 font-black text-gray-900">{reportCard.student.admissionNo}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Academic Information</h4>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <span className="font-bold text-gray-500">Year:</span>
                        <span className="col-span-2 font-black text-gray-900">{reportCard.academicInfo.academicYear}</span>
                        
                        <span className="font-bold text-gray-500">Term:</span>
                        <span className="col-span-2 font-black text-gray-900">{reportCard.academicInfo.term}</span>

                        <span className="font-bold text-gray-500">Class:</span>
                        <span className="col-span-2 font-black text-gray-900">{reportCard.academicInfo.grade} - {reportCard.academicInfo.section}</span>
                      </div>
                    </div>
                  </div>

                  {/* Grades Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Academic Performance</h4>
                    <table className="w-full text-left border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-widest border border-gray-200">Subject</th>
                          <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-widest border border-gray-200 text-center">Score</th>
                          <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-widest border border-gray-200 text-center">Max Score</th>
                          <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-widest border border-gray-200 text-center">%</th>
                          <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-widest border border-gray-200 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportCard.subjects.length > 0 ? (
                          reportCard.subjects.map(sub => (
                            <tr key={sub.code}>
                              <td className="px-4 py-3 text-sm font-bold text-gray-900 border border-gray-200">{sub.name}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-600 text-center border border-gray-200">{sub.score}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-600 text-center border border-gray-200">{sub.maxScore}</td>
                              <td className="px-4 py-3 text-sm font-black text-gray-900 text-center border border-gray-200">{sub.percentage}%</td>
                              <td className="px-4 py-3 text-sm font-black text-blue-600 text-center border border-gray-200">{sub.gradeLetter}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-sm font-bold text-gray-400 border border-gray-200">No grades recorded for this term.</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td colSpan={3} className="px-4 py-3 text-sm font-black text-right text-gray-900 border border-gray-200 uppercase tracking-widest">Overall Result:</td>
                          <td className="px-4 py-3 text-sm font-black text-gray-900 text-center border border-gray-200">{reportCard.overall.percentage}%</td>
                          <td className="px-4 py-3 text-sm font-black text-blue-700 text-center border border-gray-200 text-lg">{reportCard.overall.gradeLetter}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Attendance & Remarks */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Attendance Record</h4>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-xs font-bold text-gray-500 uppercase">Present</p>
                          <p className="text-xl font-black text-green-600">{reportCard.attendance.present}</p>
                        </div>
                        <div className="text-center border-l pl-4 border-gray-200">
                          <p className="text-xs font-bold text-gray-500 uppercase">Absent</p>
                          <p className="text-xl font-black text-red-600">{reportCard.attendance.absent}</p>
                        </div>
                        <div className="text-center border-l pl-4 border-gray-200">
                          <p className="text-xs font-bold text-gray-500 uppercase">Rate</p>
                          <p className="text-xl font-black text-blue-900">{reportCard.attendance.percentage}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Signatures</h4>
                      <div className="pt-12 flex justify-between">
                        <div className="border-t border-gray-400 w-32 text-center pt-2">
                          <p className="text-xs font-bold text-gray-500">Class Teacher</p>
                        </div>
                        <div className="border-t border-gray-400 w-32 text-center pt-2">
                          <p className="text-xs font-bold text-gray-500">Principal</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-red-500">Error loading report card.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportCards;
