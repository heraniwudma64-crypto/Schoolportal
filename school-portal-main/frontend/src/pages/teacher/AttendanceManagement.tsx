import React, { useState } from 'react';
import { MOCK_SUBJECTS } from '../../data/mockData';
import { Search, CheckCircle2, XCircle, Clock, Save, History } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Toaster, toast } from 'sonner';

const AttendanceManagement = () => {
  const [selectedClass, setSelectedClass] = useState('Grade 10A');
  const [selectedSubject, setSelectedSubject] = useState(MOCK_SUBJECTS[0].id);
  const [students, setStudents] = useState([
    { id: '1', name: 'Abebe Kebede', status: 'present' },
    { id: '2', name: 'Tigist Haile', status: 'present' },
    { id: '3', name: 'Yonas Alemu', status: 'present' },
    { id: '4', name: 'Hiwot Mengistu', status: 'present' },
    { id: '5', name: 'Solomon Tesfaye', status: 'present' },
  ]);

  const handleStatusChange = (id: string, status: 'present' | 'absent' | 'late') => {
    setStudents(students.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleSave = () => {
    toast.success('Attendance records saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
          <p className="text-sm text-gray-500">Mark student attendance for the selected session.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
            <History className="w-4 h-4" />
            Past Records
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Class / Section</label>
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
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Search Student</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Enter name or ID..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-xs font-black text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4">ID Number</th>
              <th className="px-6 py-4 text-center">Mark Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-gray-900">{student.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">STD-00{student.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleStatusChange(student.id, 'present')}
                      className={cn(
                        "flex flex-col items-center justify-center w-16 py-2 rounded-xl border-2 transition-all",
                        student.status === 'present' 
                          ? "bg-green-50 border-green-600 text-green-700" 
                          : "bg-white border-gray-100 text-gray-400 hover:border-green-200"
                      )}
                    >
                      <CheckCircle2 className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-black uppercase">Present</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, 'absent')}
                      className={cn(
                        "flex flex-col items-center justify-center w-16 py-2 rounded-xl border-2 transition-all",
                        student.status === 'absent' 
                          ? "bg-red-50 border-red-600 text-red-700" 
                          : "bg-white border-gray-100 text-gray-400 hover:border-red-200"
                      )}
                    >
                      <XCircle className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-black uppercase">Absent</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, 'late')}
                      className={cn(
                        "flex flex-col items-center justify-center w-16 py-2 rounded-xl border-2 transition-all",
                        student.status === 'late' 
                          ? "bg-amber-50 border-amber-600 text-amber-700" 
                          : "bg-white border-gray-100 text-gray-400 hover:border-amber-200"
                      )}
                    >
                      <Clock className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-black uppercase">Late</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default AttendanceManagement;
