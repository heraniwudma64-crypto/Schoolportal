import { useEffect, useMemo, useState } from 'react';

type Announcement = {
  id: string;
  title: string;
  description: string;
  date: string;
};

type Deadline = {
  id: string;
  title: string;
  courseName: string;
  dueDate: string;
  status: string;
};

type DashboardData = {
  totalSubjects: number;
  pendingAssignments: number;
  attendance: number;
  average: number;
  announcements: Announcement[];
  deadlines: Deadline[];
};

const statCards = [
  { key: 'totalSubjects', label: 'Total Subjects', accent: 'from-sky-500 to-cyan-500' },
  { key: 'pendingAssignments', label: 'Pending Assignments', accent: 'from-amber-500 to-orange-500' },
  { key: 'attendance', label: 'Attendance Percentage', accent: 'from-emerald-500 to-green-500' },
  { key: 'average', label: 'Average Grade', accent: 'from-violet-500 to-fuchsia-500' },
] as const;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusTone(status: string) {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
      return 'bg-emerald-500';
    case 'IN_PROGRESS':
      return 'bg-amber-500';
    default:
      return 'bg-rose-500';
  }
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('http://localhost:3000/dashboard/student-1');
        if (!response.ok) {
          throw new Error('Unable to load dashboard data');
        }
        const payload = await response.json();
        setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const summaryCards = useMemo(() => {
    const fallback = {
      totalSubjects: 3,
      pendingAssignments: 1,
      attendance: 95,
      average: 95,
    } as const;

    return statCards.map((card) => {
      const key = card.key as keyof typeof fallback;
      const raw = data ? (data as any)[card.key] ?? fallback[key] : fallback[key];
      const value = card.key === 'attendance' ? `${raw}%` : card.key === 'average' ? `${raw}%` : raw;
      return { ...card, value };
    });
  }, [data]);

  const attendanceDelta = useMemo(() => {
    if (!data) return undefined;
    const anyData = data as any;
    if (typeof anyData.attendanceDelta === 'number') return anyData.attendanceDelta;
    if (typeof anyData.attendanceChange === 'number') return anyData.attendanceChange;
    if (typeof anyData.previousAttendance === 'number' && typeof anyData.attendance === 'number') {
      return Math.round((anyData.attendance - anyData.previousAttendance));
    }
    return undefined;
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 font-semibold text-white">JS</div>
              <div>
                <div className="text-lg font-semibold">Student Dashboard</div>
                <div className="text-sm text-slate-500">Track learning progress and school updates</div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500">
                <span>🔎</span>
                <input className="w-full bg-transparent outline-none" placeholder="Search" />
              </label>
              <div className="flex items-center gap-3">
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">🔔</button>
                <div className="flex items-center gap-3 rounded-full border border-slate-200 px-2 py-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 font-semibold text-white">JD</div>
                  <div>
                    <div className="font-semibold">John Doe</div>
                    <div className="text-sm text-slate-500">Student</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loading && <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading dashboard…</div>}
          {error && <div className="col-span-full rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">{error}</div>}

          {summaryCards.map((card) => (
            <div key={card.key} className="relative rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
              {card.key === 'attendance' && (() => {
                const delta = attendanceDelta;
                const display = typeof delta === 'number' ? `${delta > 0 ? '+' : ''}${delta}%` : '+2%';
                const tone = typeof delta === 'number' ? (delta > 0 ? 'text-emerald-700 bg-emerald-50' : delta < 0 ? 'text-rose-700 bg-rose-50' : 'text-slate-700 bg-slate-100') : 'text-emerald-700 bg-emerald-50';
                return (
                  <div className={`absolute top-4 right-4 flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ${tone}`}>
                    {display}
                  </div>
                );
              })()}

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50">
                  {card.key === 'totalSubjects' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M3 6.5L12 11l9-4.5" stroke="#0369A1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M21 6.5v10.75a.75.75 0 0 1-1.03.7L12 16l-7.97 2.95A.75.75 0 0 1 3 17.25V6.5" stroke="#0369A1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {card.key === 'pendingAssignments' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <rect x="7" y="3" width="10" height="4" rx="1" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round" />
                      <path d="M7 7v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9.5 12.5l1.5 1.5 3-3" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {card.key === 'attendance' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M20 6L9 17l-5-5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {card.key === 'average' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M12 2l9 4-9 4-9-4 9-4z" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 10.5v5.25A2.25 2.25 0 0 0 5.25 18h13.5A2.25 2.25 0 0 0 21 15.75V10.5" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-500">{card.label}</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</div>
                </div>
              </div>

              <div className={`mt-4 h-2 w-24 rounded-full bg-gradient-to-r ${card.accent}`} />
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Recent Announcements</h2>
                <p className="text-sm text-slate-500">Latest school updates and notices.</p>
              </div>
              <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">View All</button>
            </div>
            <div className="mt-5 space-y-4">
              {data?.announcements.length ? data.announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{announcement.title}</div>
                      <div className="mt-1 text-sm text-slate-600">{announcement.description}</div>
                    </div>
                    <div className="text-sm text-slate-400">{formatDate(announcement.date)}</div>
                  </div>
                </div>
              )) : <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No announcements available yet.</div>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Upcoming Deadlines</h2>
                <p className="text-sm text-slate-500">Assignments and submissions.</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {data?.deadlines.length ? data.deadlines.map((deadline) => (
                <div key={deadline.id} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className={`mt-1 h-3 w-3 rounded-full ${getStatusTone(deadline.status)}`} />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{deadline.title}</div>
                    <div className="text-sm text-slate-500">{deadline.courseName}</div>
                    <div className="mt-2 text-sm text-slate-400">Due {formatDate(deadline.dueDate)}</div>
                  </div>
                </div>
              )) : <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No deadlines scheduled.</div>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
