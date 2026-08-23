import React, { useState, useEffect } from 'react';

const AttendanceManagement = () => {
  const [selectedClass, setSelectedClass] = useState('Grade 10A');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [students, setStudents] = useState<any[]>([]);
  const [pastRecords, setPastRecords] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch students for marking attendance
  useEffect(() => {
    if (showHistory) return;
    setLoading(true);
    fetch(`http://localhost:3000/students?className=${encodeURIComponent(selectedClass)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch students');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((student: any) => ({
            id: student.id,
            name: student.name || `${student.firstName} ${student.lastName}`,
            idNumber: student.idNumber || student.studentId || `STD-${student.id.slice(0, 5).toUpperCase()}`,
            status: 'PRESENT',
          }));
          setStudents(formatted);
        } else {
          setFallbackStudents();
        }
      })
      .catch(() => setFallbackStudents())
      .finally(() => setLoading(false));
  }, [selectedClass, showHistory]);

  // Fetch past attendance records when history view is toggled on
  useEffect(() => {
    if (!showHistory) return;
    setLoading(true);
    fetch('http://localhost:3000/attendance')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPastRecords(data);
        }
      })
      .catch((err) => console.error('Error fetching history:', err))
      .finally(() => setLoading(false));
  }, [showHistory]);

  const setFallbackStudents = () => {
    setStudents([
      { id: '76f135b8', name: 'Abebe Kebede', idNumber: 'STD-001', status: 'PRESENT' },
      { id: '3674ba87', name: 'Tigist Haile', idNumber: 'STD-002', status: 'ABSENT' },
      { id: '0c4858a7', name: 'Yonas Alemu', idNumber: 'STD-003', status: 'PRESENT' },
      { id: 'd8a8b12', name: 'Hiwot Mengistu', idNumber: 'STD-004', status: 'LATE' },
      { id: 'e9b9c23', name: 'Solomon Tesfaye', idNumber: 'STD-005', status: 'PRESENT' },
    ]);
  };

  const handleStatusChange = (studentId: string, newStatus: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const handleSaveAttendance = async () => {
    try {
      const response = await fetch('http://localhost:3000/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classSectionId: selectedClass,
          recordedById: 'current-teacher-id',
          date: new Date().toISOString().split('T')[0],
          period: 1,
          records: students.map((s) => ({
            studentId: s.id,
            status: s.status,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to save attendance');
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Error saving attendance records.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Toggle Buttons */}
      <div className="flex justify-between items-center mb-6">
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
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Class / Section</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Grade 10A">Grade 10A</option>
                <option value="Grade 10B">Grade 10B</option>
                <option value="Grade 11A">Grade 11A</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Subject</label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Search Student</label>
              <input 
                type="text" 
                placeholder="Enter name or ID..."
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Student List Table */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID Number</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mark Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Past Attendance Records Table View */
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
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
                    {loading ? 'Loading records...' : 'No past attendance history found in Supabase yet.'}
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
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;