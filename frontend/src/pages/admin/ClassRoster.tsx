import React, { useState } from 'react';
import { Search, RefreshCw, ClipboardList, CheckCircle, Clock, Eye, AlertCircle, Award, UserCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useOutletContext } from 'react-router-dom';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { getAdminSections, getAdminSectionRoster, AdminSectionSummary, AdminRosterEntry } from '../../api/adminReports';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const ClassRoster = () => {
  const { searchQuery: globalSearchQuery } = useOutletContext<{ searchQuery: string }>();
  const [localSearch, setLocalSearch] = useState('');
  const { academicYears, activeAcademicYearId, isLoading: isLoadingYears } = useAcademicYear();
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  const [selectedSection, setSelectedSection] = useState<AdminSectionSummary | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const academicYearId = selectedAcademicYearId || activeAcademicYearId;

  const {
    data: sections = [],
    isLoading: isLoadingSections,
    isRefetching: isRefetchingSections,
  } = useQuery({
    queryKey: ['adminSections', academicYearId],
    queryFn: () => getAdminSections(academicYearId),
    enabled: !!academicYearId,
  });

  const {
    data: rosterData = [],
    isLoading: isLoadingRoster,
  } = useQuery({
    queryKey: ['adminSectionRoster', selectedSection?.id, academicYearId],
    queryFn: () => getAdminSectionRoster(selectedSection!.id, academicYearId),
    enabled: isReviewModalOpen && !!selectedSection?.id && !!academicYearId,
  });

  const effectiveSearch = localSearch || globalSearchQuery || '';
  
  const filteredSections = sections.filter((sec) => {
    const teacherName = sec.homeroomTeacher || '';
    const matchesSearch =
      sec.displayName.toLowerCase().includes(effectiveSearch.toLowerCase()) || 
      teacherName.toLowerCase().includes(effectiveSearch.toLowerCase());
    const matchesStatus = statusFilter === 'All' || sec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReviewClick = (section: AdminSectionSummary) => {
    setSelectedSection(section);
    setIsReviewModalOpen(true);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['adminSections', academicYearId] });
    if (selectedSection) {
      queryClient.invalidateQueries({ queryKey: ['adminSectionRoster', selectedSection.id, academicYearId] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Roster Review</h2>
          <p className="text-sm text-gray-500">Review and inspect class rosters submitted by Home Room Teachers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoadingSections || isRefetchingSections}
            className="p-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-900 hover:bg-blue-50 transition-all disabled:opacity-50"
            title="Refresh Roster Data"
          >
            <RefreshCw className={cn("w-4 h-4", (isLoadingSections || isRefetchingSections) && "animate-spin text-blue-900")} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Academic Year</label>
          <select
            value={academicYearId}
            onChange={(e) => setSelectedAcademicYearId(e.target.value)}
            disabled={isLoadingYears}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all"
          >
            <option value="">Select Academic Year</option>
            {academicYears.map((y: any) => (
              <option key={y.id} value={y.id}>
                {y.year} {y.isCurrent ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search section or teacher..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:bg-white transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Section</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Home Room Teacher</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Enrolled Students</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subjects</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingSections ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-900" />
                      <p className="text-sm font-semibold">Loading section rosters...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSections.length > 0 ? (
                filteredSections.map((sec) => (
                  <tr key={sec.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-black text-gray-900">{sec.displayName}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {sec.homeroomTeacher ? (
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          {sec.homeroomTeacher}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {sec.enrolledCount} {sec.enrolledCount === 1 ? 'student' : 'students'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500">
                      {sec.submittedSubjects} / {sec.totalSubjects} submitted
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-max",
                        sec.status === 'Submitted' ? "bg-green-100 text-green-700" : 
                        sec.status === 'Pending Review' ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-500"
                      )}>
                        {sec.status === 'Submitted' && <CheckCircle className="w-3 h-3" />}
                        {sec.status === 'Pending Review' && <Clock className="w-3 h-3" />}
                        {sec.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleReviewClick(sec)}
                        className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors inline-flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" /> View Roster
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <ClipboardList className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm font-bold text-gray-900">No sections found</p>
                      <p className="text-xs mt-1">
                        {academicYearId ? 'No class sections match the selected filter.' : 'Please select an academic year to view class sections.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review / View Roster Modal */}
      {isReviewModalOpen && selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  Roster: {selectedSection.displayName}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Homeroom Teacher: {selectedSection.homeroomTeacher || 'Unassigned'} • {selectedSection.enrolledCount} Enrolled Students
                </p>
              </div>
              <span className={cn(
                "px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest",
                selectedSection.status === 'Submitted' ? "bg-green-100 text-green-700" : 
                selectedSection.status === 'Pending Review' ? "bg-amber-100 text-amber-700" :
                "bg-gray-100 text-gray-500"
              )}>
                {selectedSection.status}
              </span>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingRoster ? (
                <div className="py-16 text-center text-gray-400">
                  <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3 text-blue-900" />
                  <p className="text-sm font-bold text-gray-700">Loading student roster...</p>
                </div>
              ) : rosterData.length === 0 ? (
                <div className="border border-gray-200 rounded-2xl p-12 text-center text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="font-bold text-gray-900">No Enrolled Students</p>
                  <p className="text-sm mt-1 text-gray-500">
                    No active students are currently enrolled in {selectedSection.displayName} for this academic year.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-200">
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest w-16">Rank</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Admission No</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Name</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject Scores</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Marks</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Average</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rosterData.map((entry: AdminRosterEntry) => (
                        <tr key={entry.studentId} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-black text-gray-900">
                            {entry.rank === 1 ? (
                              <span className="flex items-center gap-1 text-amber-600">
                                <Award className="w-4 h-4" /> #{entry.rank}
                              </span>
                            ) : (
                              `#${entry.rank}`
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-600">
                            {entry.admissionNo || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm font-black text-gray-900">
                            {entry.studentName}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {entry.subjectScores && Object.keys(entry.subjectScores).length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(entry.subjectScores).map(([subj, score]) => (
                                  <span key={subj} className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded-md text-xs font-semibold">
                                    {subj}: {score}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs italic">No marks submitted</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-black text-right text-gray-900">
                            {entry.totalMarks}
                          </td>
                          <td className="px-4 py-3 text-sm font-black text-right text-blue-900">
                            {entry.average}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50">
              <span className="text-xs text-gray-500 font-medium">
                {rosterData.length} active {rosterData.length === 1 ? 'student' : 'students'} displayed
              </span>
              <button 
                onClick={() => setIsReviewModalOpen(false)} 
                className="px-6 py-2.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassRoster;
