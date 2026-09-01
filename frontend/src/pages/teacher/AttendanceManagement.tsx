import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { formatClassSection } from '../../lib/classSection';
import { getEnrolledStudents } from '../../api/roster';

const TeacherAttendance = () => {
  const [classSections, setClassSections] = useState<any[]>([]);
  const [teachingAssignments, setTeachingAssignments] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyDate, setHistoryDate] = useState('');
  const [historyStatus, setHistoryStatus] = useState('');
  const [historyStudent, setHistoryStudent] = useState('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [pastRecords, setPastRecords] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // 1. Fetch available class sections from database on mount with fallback
  // 1. Fetch available class sections from NestJS backend
  useEffect(() => {
    api.get('/teachers/assignments')
      .then((res: any) => {
        const assignments = Array.isArray(res) ? res : res?.data || [];
        setTeachingAssignments(assignments);
        const sections = assignments.filter((item: any, index: number, all: any[]) => all.findIndex((candidate) => candidate.classSectionId === item.classSectionId) === index).map((item: any) => ({ id: item.classSectionId, ...item.ClassSection }));

        setClassSections(sections);
        setSelectedClassId(sections[0]?.id || '');
        setSelectedSubject(assignments[0]?.Subject?.name || '');
      })
      .catch((err) => {
        console.error('Failed to load class sections:', err);
      });
  }, []);

  // 2. Fetch students using the exact classSectionId foreign key endpoint
  // 2. Fetch students using the exact classSectionId foreign key endpoint with fallback
  useEffect(() => {
    if (showHistory || !selectedClassId) return;
    const assignment = teachingAssignments.find((item) => item.classSectionId === selectedClassId);
    if (!assignment?.academicYearId) return;
    setLoading(true);
    
    getEnrolledStudents(assignment.academicYearId, selectedClassId)
      .then((response: any) => {
        const rawStudents = response;

        const formatted = rawStudents.map((student: any) => ({
          id: student.id,
          name: student.name || `${student.firstName || student.User?.firstName || ''} ${student.lastName || student.User?.lastName || ''}`.trim() || 'Unnamed Student',
          idNumber: student.idNumber || student.studentId || `STD-${student.id.slice(0, 5).toUpperCase()}`,
          status: student.status || 'PRESENT',
        }));
        
        setStudents(formatted);
      })
      .catch((err) => {
        console.error('Failed to fetch students:', err);
        setStudents([]);
      })
      .finally(() => setLoading(false));
  }, [selectedClassId, showHistory, teachingAssignments]);

  // Fetch past attendance records when history view is toggled on
  useEffect(() => {
    if (!showHistory) return;
    setLoading(true);
    
    const params = new URLSearchParams();
    if (historyDate) params.set('date', historyDate);
    if (historyStatus) params.set('status', historyStatus);
    if (historyStudent) params.set('studentName', historyStudent);
    api.get(`/attendance?${params.toString()}`)
      .then((response: any) => {
        const resData = response.data || response;
        if (Array.isArray(resData)) {
          setPastRecords(resData);
        }
      })
      .catch((err) => console.error('Error fetching history:', err))
      .finally(() => setLoading(false));
  }, [showHistory, historyDate, historyStatus, historyStudent]);

  const handleStatusChange = (studentId: string, newStatus: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const handleSaveAttendance = async () => {
    try {
      await api.post('/attendance', {
        classSectionId: selectedClassId,
        subject: selectedSubject,
        recordedById: user?.id,
        date: new Date().toISOString().split('T')[0],
        period: 1,
        records: students.map((s) => ({
          studentId: s.id,
          status: s.status,
        })),
      });

      alert('Attendance saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Error saving attendance records.');
    }
  };

  // Filter students based on search input (name or ID)
  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(query) ||
      student.idNumber.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with Toggle Buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-sm text-gray-500">
            {showHistory ? 'Viewing past attendance records database logs.' : 'Mark student attendance for the selected session.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 shadow-sm flex items-center gap-2 transition-all"
          >
            <span>🕒</span> {showHistory ? 'Back to Marking' : 'Past Records'}
          </button>
          {!showHistory && (
            <button 
              onClick={handleSaveAttendance}
              className="bg-blue-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-800 shadow-sm flex items-center gap-2 transition-all"
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
      
      {!showHistory ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Class / Section</label>
              <select 
                value={selectedClassId} 
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {classSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {formatClassSection(sec)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Subject</label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {[...new Map(teachingAssignments.map((item) => [item.Subject.id, item.Subject])).values()].map((subject: any) => (
                  <option key={subject.id} value={subject.name}>{subject.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Search Student</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter name or ID..."
                  className="w-full pl-9 pr-3 rounded-lg border-gray-300 border p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Student List Table */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Enrolled Students Linked by classSectionId</span>
              <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-full">
                {filteredStudents.length} Students Found
              </span>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID Number</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mark Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                      Querying students from database...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                      No students found linked to this class section ID in the database. Ensure students have this section's UUID set as their `classSectionId`.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.idNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleStatusChange(student.id, 'PRESENT')}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all ${
                              student.status === 'PRESENT' ? 'border-green-600 bg-white text-green-700 shadow-sm ring-1 ring-green-600' : 'border-gray-200 text-gray-400 bg-white'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${student.status === 'PRESENT' ? 'border border-green-600 text-green-600' : 'border border-gray-300 text-gray-300'}`}>✓</span>
                            PRESENT
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, 'ABSENT')}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all ${
                              student.status === 'ABSENT' ? 'border-red-600 bg-white text-red-600 shadow-sm ring-1 ring-red-600' : 'border-gray-200 text-gray-400 bg-white'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${student.status === 'ABSENT' ? 'border border-red-600 text-red-600' : 'border border-gray-300 text-gray-300'}`}>✕</span>
                            ABSENT
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, 'LATE')}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all ${
                              student.status === 'LATE' ? 'border-orange-500 bg-white text-orange-600 shadow-sm ring-1 ring-orange-500' : 'border-gray-200 text-gray-400 bg-white'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${student.status === 'LATE' ? 'border border-orange-500 text-orange-500' : 'border border-gray-300 text-gray-300'}`}>⏱</span>
                            LATE
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Past Attendance Records Table View */
        <div className="space-y-4"><div className="bg-white p-4 rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-3"><input type="date" value={historyDate} onChange={(event) => setHistoryDate(event.target.value)} className="border rounded-lg px-3 py-2 text-sm" /><input value={historyStudent} onChange={(event) => setHistoryStudent(event.target.value)} placeholder="Student name" className="border rounded-lg px-3 py-2 text-sm" /><select value={historyStatus} onChange={(event) => setHistoryStatus(event.target.value)} className="border rounded-lg px-3 py-2 text-sm"><option value="">All statuses</option><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late</option><option value="EXCUSED">Excused</option></select><button onClick={() => { setHistoryDate(''); setHistoryStudent(''); setHistoryStatus(''); }} className="border rounded-lg px-3 py-2 text-sm">Clear filters</button></div><div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pastRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                    {loading ? 'Loading records...' : 'No past attendance history found in database yet.'}
                  </td>
                </tr>
              ) : (
                pastRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {record.Student?.firstName ? `${record.Student.firstName} ${record.Student.lastName}` : 'Student Record'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Period {record.period || 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        record.status === 'PRESENT' ? 'bg-green-50 text-green-700 border border-green-200' :
                        record.status === 'ABSENT' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-orange-50 text-orange-700 border border-orange-200'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div></div>
      )}
    </div>
  );
};

export default TeacherAttendance;
