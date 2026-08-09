import { useMemo, useState } from 'react';

type AttendanceRecord = {
  date: string;
  subject: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  teacher: string;
};

const months = [
  'All Months',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const attendanceRecords: AttendanceRecord[] = [
  { date: '2024-05-18', subject: 'Mathematics', status: 'PRESENT', teacher: 'Meron Tadesse' },
  { date: '2024-05-17', subject: 'Physics', status: 'PRESENT', teacher: 'Meron Tadesse' },
  { date: '2024-05-16', subject: 'English', status: 'LATE', teacher: 'Dawit Gebre' },
  { date: '2024-05-15', subject: 'Mathematics', status: 'PRESENT', teacher: 'Meron Tadesse' },
  { date: '2024-05-14', subject: 'Physics', status: 'ABSENT', teacher: 'Meron Tadesse' },
];

function getMonthName(dateString: string) {
  return new Date(dateString).toLocaleString('en', { month: 'long' });
}

function getBadgeStyle(status: AttendanceRecord['status']) {
  switch (status) {
    case 'PRESENT':
      return 'text-emerald-700 bg-emerald-100';
    case 'ABSENT':
      return 'text-rose-700 bg-rose-100';
    case 'LATE':
      return 'text-amber-800 bg-amber-100';
    default:
      return 'text-slate-700 bg-slate-100';
  }
}

export default function Attendance() {
  const [selectedMonth, setSelectedMonth] = useState('All Months');

  const filteredRecords = useMemo(() => {
    if (selectedMonth === 'All Months') return attendanceRecords;
    return attendanceRecords.filter((record) => getMonthName(record.date) === selectedMonth);
  }, [selectedMonth]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Attendance Records</h1>
          <p className="mt-2 text-sm text-slate-500">Review your attendance summary and recent activity.</p>
        </div>
        <div className="w-full max-w-xs rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto">
          <div className="flex items-center gap-3">
            <span>All Months</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
            >
              {months.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 text-xl">✓</div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Present</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">172 Days</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 text-xl">✕</div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Absent</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">5 Days</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 text-xl">⏰</div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Late</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">3 Days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Recent Attendance Details</h2>
            <p className="mt-1 text-sm text-slate-500">Details for the selected month.</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-left">
            <thead>
              <tr>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Date</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Subject</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Teacher</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={`${record.date}-${record.subject}`} className="rounded-3xl bg-white shadow-sm">
                    <td className="whitespace-nowrap px-4 py-5 align-top">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">📅</span>
                        <span>{record.date}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 align-top">
                      <p className="font-medium text-slate-900">{record.subject}</p>
                    </td>
                    <td className="px-4 py-5 align-top">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBadgeStyle(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-5 align-top text-sm text-slate-700">{record.teacher}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                    No attendance records for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
