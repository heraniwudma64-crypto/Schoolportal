import React, { useState, useMemo } from 'react';
import { Users, UserPlus, Search, RefreshCw, ClipboardList, GraduationCap, Calendar, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAcademicYears, getGradeLevels } from '../../api/academicStructure';
import { getRoster, getRosterSummary } from '../../api/roster';
import { EnrollStudentModal } from '../../components/admin/EnrollStudentModal';
import { cn } from '../../lib/utils';
import { useOutletContext } from 'react-router-dom';

const ClassRoster = () => {
  const { searchQuery: globalSearchQuery } = useOutletContext<{ searchQuery: string }>();
  const [localSearch, setLocalSearch] = useState('');
  
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [gradeLevelId, setGradeLevelId] = useState<string>('');
  const [classSectionId, setClassSectionId] = useState<string>('');
  
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // Queries
  const { data: academicYears = [] } = useQuery({ queryKey: ['academicYears'], queryFn: getAcademicYears });
  const { data: gradeLevels = [] } = useQuery({ queryKey: ['gradeLevels'], queryFn: getGradeLevels });
  
  const { data: roster = [], isLoading: loadingRoster, refetch } = useQuery({
    queryKey: ['roster', academicYearId, classSectionId],
    queryFn: () => getRoster(academicYearId, classSectionId),
    enabled: !!academicYearId && !!classSectionId
  });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['rosterSummary', academicYearId, classSectionId],
    queryFn: () => getRosterSummary(academicYearId, classSectionId),
    enabled: !!academicYearId && !!classSectionId
  });

  // Set default Academic Year if none selected
  React.useEffect(() => {
    if (!academicYearId && academicYears.length > 0) {
      const current = academicYears.find(y => y.isCurrent) || academicYears[0];
      setAcademicYearId(current.id);
    }
  }, [academicYears, academicYearId]);

  const selectedGrade = gradeLevels.find(g => g.id === gradeLevelId);
  const sections = selectedGrade?.ClassSection || [];

  const effectiveSearch = localSearch || globalSearchQuery || '';

  const filteredRoster = useMemo(() => {
    let result = Array.isArray(roster) ? roster : [];
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      result = result.filter((r: any) => 
        r.student.firstName.toLowerCase().includes(q) ||
        r.student.lastName.toLowerCase().includes(q) ||
        r.student.admissionNo.toLowerCase().includes(q)
      );
    }
    return result;
  }, [roster, effectiveSearch]);

  const isLoading = loadingRoster || loadingSummary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Class Roster</h2>
          <p className="text-sm text-gray-500">View and manage student enrollments by class section.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-900 hover:bg-blue-50 transition-all">
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
          <button onClick={() => setIsEnrollModalOpen(true)} className="flex items-center gap-3 px-6 py-3 bg-blue-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20">
            <UserPlus className="w-4 h-4" /> Enroll Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Academic Year</label>
          <select value={academicYearId} onChange={e => setAcademicYearId(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all">
            <option value="">Select Academic Year</option>
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Grade Level</label>
          <select value={gradeLevelId} onChange={e => { setGradeLevelId(e.target.value); setClassSectionId(''); }} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all">
            <option value="">Select Grade Level</option>
            {gradeLevels.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Class Section</label>
          <select value={classSectionId} onChange={e => setClassSectionId(e.target.value)} disabled={!gradeLevelId} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all disabled:opacity-50">
            <option value="">Select Class Section</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-sm font-bold text-gray-500 mb-1">Class</p>
            <p className="text-xl font-black text-blue-900">{summary.gradeName} - {summary.name}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-sm font-bold text-gray-500 mb-1">Room</p>
            <p className="text-xl font-black text-blue-900">{summary.roomNumber || '—'}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-sm font-bold text-gray-500 mb-1">Enrolled</p>
            <p className="text-xl font-black text-blue-900">{summary.totalEnrolled}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-sm font-bold text-gray-500 mb-1">Capacity</p>
            <p className="text-xl font-black text-blue-900">{summary.capacity || '—'}</p>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
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
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendance</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Exam Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-3 text-sm text-gray-500 font-bold">Loading roster...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRoster.length > 0 ? (
                filteredRoster.map((r: any, idx: number) => {
                  const initials = r.student.firstName.charAt(0) + r.student.lastName.charAt(0);
                  const att = r.attendancePercentage;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-bold text-gray-400">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {r.student.avatarUrl ? (
                            <img src={r.student.avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-blue-900/5 rounded-xl flex items-center justify-center text-blue-900 font-black text-sm flex-shrink-0">
                              {initials}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-black text-gray-900">{r.student.firstName} {r.student.lastName}</p>
                            <p className="text-xs text-gray-400">{r.student.admissionNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{r.student.gender || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-bold", 
                            att === null ? "text-gray-400" :
                            att >= 90 ? "text-green-600" :
                            att >= 75 ? "text-amber-600" : "text-red-600"
                          )}>
                            {att !== null ? `${att}%` : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          r.examStatus === 'Completed' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        )}>
                          {r.examStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          r.status === 'ACTIVE' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                        )}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <ClipboardList className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm font-bold text-gray-900">No students found</p>
                      <p className="text-xs mt-1 max-w-sm mx-auto">
                        {!academicYearId || !classSectionId 
                          ? "Please select an Academic Year, Grade Level, and Class Section to view the roster."
                          : "No students are currently enrolled in this class section."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EnrollStudentModal 
        isOpen={isEnrollModalOpen} 
        onClose={() => setIsEnrollModalOpen(false)}
        defaultAcademicYearId={academicYearId}
        defaultGradeLevelId={gradeLevelId}
        defaultClassSectionId={classSectionId}
      />
    </div>
  );
};

export default ClassRoster;
