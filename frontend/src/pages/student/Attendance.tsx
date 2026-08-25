import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';

const StudentAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage('');

    // api.get returns the data payload directly because of res.json() in api.ts
    api.get<any[]>('/students/me/attendance')
      .then((data) => {
        if (!isMounted) return;
        console.log("Student attendance data received:", data);

        const recordsList = Array.isArray(data) 
          ? data 
          : Array.isArray(data?.records) 
            ? data.records 
            : Array.isArray(data?.data) 
              ? data.data 
              : [];

        setAttendanceRecords(recordsList);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch student attendance:", err);
        if (!isMounted) return;
        setErrorMessage(err?.message || 'Failed to load your attendance records.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Attendance History</h2>
        <p className="text-sm text-gray-500">View your personal attendance records and status.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Attendance Log</h3>
          <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-full">
            {attendanceRecords.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4">Subject / Class</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    Loading your attendance records...
                  </td>
                </tr>
              )}

              {errorMessage && !isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-red-600">
                    {errorMessage}
                  </td>
                </tr>
              )}

              {!isLoading && !errorMessage && attendanceRecords.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    No attendance records found.
                  </td>
                </tr>
              )}

              {!isLoading && attendanceRecords.map((record: any, index: number) => (
                <tr key={record?.id || index} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {record?.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Period {record?.period || 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {record?.subject || record?.ClassSection?.name || record?.className || 'General Session'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      record?.status === 'PRESENT' ? 'bg-green-50 text-green-700 border border-green-200' :
                      record?.status === 'ABSENT' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-orange-50 text-orange-700 border border-orange-200'
                    }`}>
                      {record?.status || 'PRESENT'}
                    </span>
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

export default StudentAttendance;