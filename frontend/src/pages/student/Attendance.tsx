import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getMyAttendance } from '../../api/students';

const Attendance = () => {
  const { data: attendance = [], isLoading, isError } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: getMyAttendance,
  });

  const present = attendance.filter((record) => record.status === 'PRESENT').length;
  const absent = attendance.filter((record) => record.status === 'ABSENT').length;
  const late = attendance.filter((record) => record.status === 'LATE').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Attendance Records</h2>
        <div className="flex gap-2">
          <select className="bg-white border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20">
            <option>All Months</option>
            <option>May 2024</option>
            <option>April 2024</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Present</p>
            <p className="text-2xl font-bold text-gray-900">{present} Days</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Absent</p>
            <p className="text-2xl font-bold text-gray-900">{absent} Days</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Late</p>
            <p className="text-2xl font-bold text-gray-900">{late} Days</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Recent Attendance Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Class / Section</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Teacher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">Loading attendance records...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-red-600">Could not load attendance records.</td></tr>
              )}
              {!isLoading && !isError && attendance.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">No attendance records yet.</td></tr>
              )}
              {attendance.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(row.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{row.ClassSection.name}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      row.status === 'PRESENT' ? "bg-green-50 text-green-600" :
                      row.status === 'ABSENT' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {row.User.Teacher ? `${row.User.Teacher.firstName} ${row.User.Teacher.lastName}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
