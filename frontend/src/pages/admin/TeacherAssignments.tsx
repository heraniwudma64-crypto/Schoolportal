import React, { useState, useEffect } from 'react';
import { Users, UserPlus, ClipboardList, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useOutletContext } from 'react-router-dom';
import { getAcademicYears, getGradeLevels, getGradeSubjects, AcademicYear, GradeLevel, GradeSubject } from '../../api/academicStructure';
import { teachersApi, Teacher } from '../../api/teachers';
import { teacherAssignmentsApi, TeacherAssignment, SubjectTeacherAssignment } from '../../api/teacherAssignments';
import { toast } from 'sonner';

const TeacherAssignments = () => {
  const { searchQuery: globalSearchQuery } = useOutletContext<{ searchQuery: string }>();
  
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicYearId, setAcademicYearId] = useState<string>('');
  
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [gradeSubjects, setGradeSubjects] = useState<GradeSubject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [homeRoomAssignments, setHomeRoomAssignments] = useState<TeacherAssignment[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectTeacherAssignment[]>([]);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'HomeRoom' | 'Subject'>('HomeRoom');
  
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [yearsRes, gradesRes, subjectsRes, teachersRes] = await Promise.all([
        getAcademicYears(),
        getGradeLevels(),
        getGradeSubjects(),
        teachersApi.getTeachers()
      ]);
      setAcademicYears(yearsRes);
      setGradeLevels(gradesRes);
      setGradeSubjects(subjectsRes);
      setTeachers(teachersRes);
      
      const current = yearsRes.find(y => y.isCurrent) || yearsRes[0];
      if (current) {
        setAcademicYearId(current.id);
      }
    } catch (err) {
      toast.error('Failed to load basic data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (yearId: string) => {
    try {
      const [hr, sub] = await Promise.all([
        teacherAssignmentsApi.getHomeRoomAssignments(yearId),
        teacherAssignmentsApi.getSubjectAssignments(yearId)
      ]);
      setHomeRoomAssignments(hr);
      setSubjectAssignments(sub);
    } catch (err) {
      toast.error('Failed to load assignments');
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (academicYearId) {
      fetchAssignments(academicYearId);
    }
  }, [academicYearId]);

  const handleAssignClick = (type: 'HomeRoom' | 'Subject', editItem?: any) => {
    setAssignmentType(type);
    setSelectedGradeId('');
    setSelectedSectionId('');
    setSelectedSubjectId('');
    setSelectedTeacherId('');
    
    if (editItem) {
      // Find the grade by name to pre-select
      const grade = gradeLevels.find(g => g.name === editItem.grade || g.name === `Grade ${editItem.grade}`);
      if (grade) {
        setSelectedGradeId(grade.id);
        const section = grade.ClassSection.find(s => s.name === editItem.section || s.id === editItem.classSectionId);
        if (section) setSelectedSectionId(section.id);
      }
      if (type === 'Subject' && editItem.subject) {
        setSelectedSubjectId(editItem.subject.id);
      }
      if (editItem.teacher) {
        setSelectedTeacherId(editItem.teacher.id);
      }
    }
    
    setIsAssignModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedSectionId) return toast.error('Please select a section');
    if (assignmentType === 'Subject' && !selectedSubjectId) return toast.error('Please select a subject');
    // If no teacher is selected for homeroom, it acts as unassign. For subject, maybe it's required.
    if (assignmentType === 'Subject' && !selectedTeacherId) return toast.error('Please select a teacher');

    setIsSaving(true);
    try {
      if (assignmentType === 'HomeRoom') {
        await teacherAssignmentsApi.assignHomeRoomTeacher(selectedSectionId, selectedTeacherId || null);
        toast.success('Home Room teacher updated');
      } else {
        await teacherAssignmentsApi.assignSubjectTeacher({
          classSectionId: selectedSectionId,
          subjectId: selectedSubjectId,
          teacherId: selectedTeacherId,
          academicYearId: academicYearId
        });
        toast.success('Subject teacher updated');
      }
      setIsAssignModalOpen(false);
      fetchAssignments(academicYearId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save assignment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnassignSubject = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) return;
    try {
      await teacherAssignmentsApi.removeSubjectTeacher(id);
      toast.success('Assignment removed');
      fetchAssignments(academicYearId);
    } catch (err) {
      toast.error('Failed to remove assignment');
    }
  };

  // Derive dropdown options
  const selectedGrade = gradeLevels.find(g => g.id === selectedGradeId);
  const sectionsForGrade = selectedGrade?.ClassSection || [];
  const subjectsForGrade = gradeSubjects
    .filter(gs => gs.gradeLevelId === selectedGradeId && (!gs.academicYearId || gs.academicYearId === academicYearId))
    .map(gs => gs.Subject);

  // Compute stats
  const totalTeachers = teachers.length;
  const homeRoomCount = homeRoomAssignments.filter(a => a.teacher).length;
  // A teacher is assigned if they are in homeRoom or subject array
  const assignedTeacherIds = new Set([
    ...homeRoomAssignments.filter(a => a.teacher).map(a => a.teacher!.id),
    ...subjectAssignments.filter(a => a.teacher).map(a => a.teacher!.id)
  ]);
  const assignedCount = assignedTeacherIds.size;
  const unassignedCount = totalTeachers - assignedCount;

  // Filter based on global search
  const query = globalSearchQuery?.toLowerCase() || '';
  const filteredHomeRoom = homeRoomAssignments.filter(a => 
    a.grade.toLowerCase().includes(query) || 
    a.section.toLowerCase().includes(query) || 
    (a.teacher?.name || '').toLowerCase().includes(query)
  );
  
  const filteredSubject = subjectAssignments.filter(a => 
    a.grade.toLowerCase().includes(query) || 
    a.section.toLowerCase().includes(query) || 
    a.subject.name.toLowerCase().includes(query) || 
    (a.teacher?.name || '').toLowerCase().includes(query)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Teacher Assignments</h2>
          <p className="text-sm text-gray-500">Assign home room teachers and subject teachers to classes and sections.</p>
        </div>
        <div className="flex items-center gap-3">
           <select 
              value={academicYearId} 
              onChange={e => setAcademicYearId(e.target.value)} 
              className="h-12 px-4 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all shadow-sm"
              disabled={loading}
            >
              {academicYears.map(ay => (
                <option key={ay.id} value={ay.id}>{ay.year}</option>
              ))}
            </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-gray-400" />
            <p className="text-sm font-bold text-gray-500">Total Teachers</p>
          </div>
          <p className="text-2xl font-black text-gray-900">{totalTeachers}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="w-5 h-5 text-blue-500" />
            <p className="text-sm font-bold text-gray-500">Assigned Teachers</p>
          </div>
          <p className="text-2xl font-black text-blue-600">{assignedCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-purple-500" />
            <p className="text-sm font-bold text-gray-500">Home Room Sections</p>
          </div>
          <p className="text-2xl font-black text-purple-600">{homeRoomCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <UserPlus className="w-5 h-5 text-amber-500" />
            <p className="text-sm font-bold text-gray-500">Unassigned</p>
          </div>
          <p className="text-2xl font-black text-amber-600">{unassignedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Section A - Home Room Assignments */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-black text-gray-900">Home Room Teachers</h3>
              <button 
                onClick={() => handleAssignClick('HomeRoom')}
                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Assign
              </button>
            </div>
            <p className="text-sm text-gray-500">Assign one home room teacher to each class section.</p>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Section</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Teacher</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredHomeRoom.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400">No home room assignments found</td></tr>
                ) : filteredHomeRoom.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.grade} - {item.section}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{item.teacher?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          item.teacher ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {item.teacher ? 'Assigned' : 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                         onClick={() => handleAssignClick('HomeRoom', item)}
                         className="px-4 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors inline-block"
                       >
                         {item.teacher ? 'Edit' : 'Assign'}
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section B - Subject Teacher Assignments */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-black text-gray-900">Subject Teachers</h3>
              <button 
                 onClick={() => handleAssignClick('Subject')}
                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Assign
              </button>
            </div>
            <p className="text-sm text-gray-500">Assign teachers to subjects for each class section.</p>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Section</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Teacher</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubject.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400">No subject assignments found</td></tr>
                ) : filteredSubject.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.grade} - {item.section}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-600">{item.subject.name}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{item.teacher?.name || '—'}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button 
                         onClick={() => handleAssignClick('Subject', item)}
                         className="px-4 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors inline-block"
                       >
                         Edit
                       </button>
                       <button 
                         onClick={() => handleUnassignSubject(item.id)}
                         className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors inline-block"
                       >
                         Remove
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Reusable Dialog for Teacher Assignment */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">
                Assign {assignmentType === 'HomeRoom' ? 'Home Room' : 'Subject'} Teacher
              </h3>
              <p className="text-sm text-gray-500 mt-1">Select the details to make the assignment.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Grade</label>
                  <select 
                    value={selectedGradeId}
                    onChange={(e) => {
                      setSelectedGradeId(e.target.value);
                      setSelectedSectionId('');
                      setSelectedSubjectId('');
                    }}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all"
                  >
                    <option value="">Select Grade</option>
                    {gradeLevels.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Section</label>
                  <select 
                    value={selectedSectionId}
                    onChange={e => setSelectedSectionId(e.target.value)}
                    disabled={!selectedGradeId}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">Select Section</option>
                    {sectionsForGrade.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {assignmentType === 'Subject' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Subject</label>
                  <select 
                    value={selectedSubjectId}
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    disabled={!selectedGradeId || subjectsForGrade.length === 0}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">Select Subject</option>
                    {subjectsForGrade.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Teacher</label>
                <select 
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all"
                >
                  <option value="">{assignmentType === 'HomeRoom' ? 'Unassigned (None)' : 'Select Teacher'}</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                  ))}
                </select>
              </div>

            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button 
                onClick={() => setIsAssignModalOpen(false)} 
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="px-6 py-3 bg-blue-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;
