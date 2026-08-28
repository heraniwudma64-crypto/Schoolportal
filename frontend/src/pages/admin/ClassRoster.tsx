import React, { useState } from 'react';
import { Search, RefreshCw, ClipboardList, CheckCircle, XCircle, FileText, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useOutletContext } from 'react-router-dom';
import { getAcademicYears } from '../../api/academicStructure';
import { useQuery } from '@tanstack/react-query';

const ClassRoster = () => {
  const { searchQuery: globalSearchQuery } = useOutletContext<{ searchQuery: string }>();
  const [localSearch, setLocalSearch] = useState('');
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  const [selectedSection, setSelectedSection] = useState<any | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const { data: academicYears = [] } = useQuery({ queryKey: ['academicYears'], queryFn: getAcademicYears });

  React.useEffect(() => {
    if (!academicYearId && academicYears.length > 0) {
      const current = academicYears.find(y => y.isCurrent) || academicYears[0];
      setAcademicYearId(current.id);
    }
  }, [academicYears, academicYearId]);

  // Mock data for roster submissions
  const mockSubmissions = [
    { id: 1, section: 'Grade 10A', teacher: 'Alemu', submittedDate: 'Aug 27, 2026', status: 'Pending Review', studentsCount: 25 },
    { id: 2, section: 'Grade 10B', teacher: 'Kebede', submittedDate: null, status: 'Draft', studentsCount: 28 },
    { id: 3, section: 'Grade 10C', teacher: 'Abebe', submittedDate: 'Aug 26, 2026', status: 'Approved', studentsCount: 24 },
    { id: 4, section: 'Grade 9A', teacher: 'Chala', submittedDate: 'Aug 27, 2026', status: 'Rejected', studentsCount: 30 },
  ];

  const effectiveSearch = localSearch || globalSearchQuery || '';
  
  const filteredSubmissions = mockSubmissions.filter(sub => {
    const matchesSearch = sub.section.toLowerCase().includes(effectiveSearch.toLowerCase()) || 
                          sub.teacher.toLowerCase().includes(effectiveSearch.toLowerCase());
    const matchesStatus = statusFilter === 'All' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReviewClick = (section: any) => {
    setSelectedSection(section);
    setIsReviewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Roster Review</h2>
          <p className="text-sm text-gray-500">Review and approve class rosters submitted by Home Room Teachers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-900 hover:bg-blue-50 transition-all">
            <RefreshCw className="w-4 h-4" />
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
           <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Search</label>
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input
               type="text"
               placeholder="Search section or teacher..."
               value={localSearch}
               onChange={e => setLocalSearch(e.target.value)}
               className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:bg-white transition-all"
             />
           </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all">
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
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
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Submitted</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-black text-gray-900">{sub.section}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{sub.teacher}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500">{sub.submittedDate || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-max",
                        sub.status === 'Approved' ? "bg-green-100 text-green-700" : 
                        sub.status === 'Pending Review' ? "bg-amber-100 text-amber-700" :
                        sub.status === 'Rejected' ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-500"
                      )}>
                        {sub.status === 'Approved' && <CheckCircle className="w-3 h-3" />}
                        {sub.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleReviewClick(sub)}
                        className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors inline-flex items-center gap-2"
                      >
                        {sub.status === 'Pending Review' ? (
                          <>
                            <FileText className="w-4 h-4" /> Review
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" /> View
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <ClipboardList className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm font-bold text-gray-900">No submissions found</p>
                      <p className="text-xs mt-1">Adjust your filters to see more results.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusable Dialog for Review (UI only) */}
      {isReviewModalOpen && selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  Review Roster: {selectedSection.section}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Submitted by {selectedSection.teacher} • {selectedSection.studentsCount} Students</p>
              </div>
              <span className={cn("px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest",
                 selectedSection.status === 'Approved' ? "bg-green-100 text-green-700" : 
                 selectedSection.status === 'Pending Review' ? "bg-amber-100 text-amber-700" :
                 selectedSection.status === 'Rejected' ? "bg-red-100 text-red-700" :
                 "bg-gray-100 text-gray-500"
              )}>
                {selectedSection.status}
              </span>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
                <ClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="font-bold text-gray-900">Roster Details Preview</p>
                <p className="text-sm mt-2">This is a frontend placeholder for the detailed student roster view.</p>
                <p className="text-xs text-gray-400 mt-1">The actual list of {selectedSection.studentsCount} students will be displayed here once connected to the backend.</p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50">
              <button 
                onClick={() => setIsReviewModalOpen(false)} 
                className="px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              
              {selectedSection.status === 'Pending Review' && (
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsReviewModalOpen(false)} 
                    className="px-6 py-3 bg-red-50 text-red-700 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => setIsReviewModalOpen(false)} 
                    className="px-6 py-3 bg-green-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassRoster;
