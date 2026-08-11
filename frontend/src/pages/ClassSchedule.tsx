import { useMemo, useState } from 'react';

type ScheduleItem = {
  day: string;
  subject: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  accent: string;
};

const scheduleData: ScheduleItem[] = [
  { day: 'Monday', subject: 'Mathematics', teacher: 'Mr. Daniel', room: 'Room 204', startTime: '08:00', endTime: '09:00', accent: 'bg-sky-100 text-sky-700' },
  { day: 'Monday', subject: 'Computer Science', teacher: 'Ms. Sara', room: 'Lab 1', startTime: '10:00', endTime: '11:00', accent: 'bg-violet-100 text-violet-700' },
  { day: 'Tuesday', subject: 'English', teacher: 'Mr. Michael', room: 'Room 105', startTime: '09:00', endTime: '10:00', accent: 'bg-emerald-100 text-emerald-700' },
  { day: 'Wednesday', subject: 'Physics', teacher: 'Ms. Hana', room: 'Room 301', startTime: '08:00', endTime: '09:00', accent: 'bg-amber-100 text-amber-700' },
  { day: 'Thursday', subject: 'Database Systems', teacher: 'Mr. Abel', room: 'Lab 2', startTime: '10:00', endTime: '11:00', accent: 'bg-rose-100 text-rose-700' },
  { day: 'Friday', subject: 'Programming', teacher: 'Mr. Daniel', room: 'Computer Lab', startTime: '09:00', endTime: '10:00', accent: 'bg-indigo-100 text-indigo-700' },
];

const weekOptions = [
  { key: 'current', label: 'Aug 10 – Aug 16, 2026' },
  { key: 'next', label: 'Aug 17 – Aug 23, 2026' },
  { key: 'prev', label: 'Aug 03 – Aug 09, 2026' },
];

export default function ClassSchedule() {
  const [weekIndex, setWeekIndex] = useState(0);

  const groupedSchedule = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return days.map((day) => ({
      day,
      items: scheduleData.filter((item) => item.day === day),
    }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Weekly Class Schedule</h1>
              <p className="mt-2 text-sm text-slate-500">View your classes, instructors, classrooms, and weekly timetable.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                ‹ Previous Week
              </button>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                {weekOptions[weekIndex].label}
              </div>
              <button className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                Next Week ›
              </button>
              <button
                onClick={() => setWeekIndex(0)}
                className="rounded-full bg-[#1e3a8a] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#1e2a5e]"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        <div className="hidden gap-4 lg:grid lg:grid-cols-5">
          {groupedSchedule.map((dayGroup) => (
            <div key={dayGroup.day} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-lg font-semibold text-slate-900">{dayGroup.day}</h2>
              </div>
              <div className="space-y-3">
                {dayGroup.items.length ? dayGroup.items.map((item) => (
                  <div key={`${item.day}-${item.subject}`} className="rounded-[16px] border border-slate-200 bg-slate-50 p-3">
                    <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.accent}`}>
                      {item.startTime} – {item.endTime}
                    </div>
                    <div className="mt-3 font-semibold text-slate-900">{item.subject}</div>
                    <div className="mt-1 text-sm text-slate-600">{item.teacher}</div>
                    <div className="mt-2 text-sm text-slate-500">{item.room}</div>
                  </div>
                )) : <div className="rounded-[14px] border border-dashed border-slate-200 p-4 text-sm text-slate-500">No classes</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 lg:hidden">
          {groupedSchedule.map((dayGroup) => (
            <div key={dayGroup.day} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{dayGroup.day}</h2>
              <div className="mt-4 space-y-3">
                {dayGroup.items.length ? dayGroup.items.map((item) => (
                  <div key={`${item.day}-${item.subject}-mobile`} className="rounded-[16px] border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.accent}`}>
                        {item.startTime} – {item.endTime}
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.room}</div>
                    </div>
                    <div className="mt-3 font-semibold text-slate-900">{item.subject}</div>
                    <div className="mt-1 text-sm text-slate-600">{item.teacher}</div>
                  </div>
                )) : <div className="rounded-[14px] border border-dashed border-slate-200 p-4 text-sm text-slate-500">No classes</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
