<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function StudentDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const [coursesRes, assignmentsRes, attendanceRes] = await Promise.all([
          api.get('/courses'),
          api.get('/assignments'),
          api.get('/attendance/my')
        ]);

        setCourses(coursesRes.data);
        setAssignments(assignmentsRes.data);
        setAttendance(attendanceRes.data);
      } catch (err) {
        console.error('Failed to load student dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading student portal...</div>;

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Student Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      <hr style={{ margin: '20px 0' }} />

      {/* Courses Section */}
      <section style={{ marginBottom: '30px' }}>
        <h3>My Courses</h3>
        {courses.length === 0 ? <p>No courses enrolled yet.</p> : (
          <ul>
            {courses.map((course) => (
              <li key={course.id}><strong>{course.title}</strong> - {course.description}</li>
            ))}
          </ul>
        )}
      </section>

      {/* Assignments Section */}
      <section style={{ marginBottom: '30px' }}>
        <h3>Assignments</h3>
        {assignments.length === 0 ? <p>No active assignments.</p> : (
          <ul>
            {assignments.map((assignment) => (
              <li key={assignment.id}>
                <strong>{assignment.title}</strong> (Due: {new Date(assignment.dueDate).toLocaleDateString()})
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Attendance Section */}
      <section>
        <h3>Attendance Record</h3>
        {attendance.length === 0 ? <p>No attendance records found.</p> : (
          <ul>
            {attendance.map((att, index) => (
              <li key={index}>
                Date: {new Date(att.date).toLocaleDateString()} — Status: <strong>{att.status}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
=======
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

function DashboardFallback({
  loading,
  error,
  showRefresh,
  onRefresh,
}: {
  loading: boolean;
  error: boolean;
  showRefresh: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="col-span-full rounded-[16px] border border-slate-200 bg-[#f8fafc] p-8 shadow-sm">
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#1e3a8a] text-2xl text-white">
          🎓
        </div>
        <div>
          <div className="text-base font-semibold text-slate-900">Mentor Academy</div>
          <div className="mt-1 text-sm text-slate-500">Getting your dashboard ready.</div>
        </div>
        <div className={`mt-4 h-3 w-28 rounded-full ${loading ? 'bg-slate-300/80 animate-pulse' : 'bg-slate-200'}`} />
        {error && showRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="mt-2 text-sm font-medium text-slate-500 underline decoration-slate-300 hover:text-slate-700"
          >
            Refresh
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRefreshLink, setShowRefreshLink] = useState(false);

  const loadData = async () => {
    try {
      const response = await fetch('http://localhost:3000/dashboard/student-1');
      if (!response.ok) {
        throw new Error('Unable to load dashboard data');
      }
      const payload = await response.json();
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const timeout = window.setTimeout(() => {
      setShowRefreshLink(true);
    }, 3000);

    return () => window.clearTimeout(timeout);
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

        <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
          {!data && (loading || error) ? (
            <DashboardFallback
              loading={loading}
              error={Boolean(error)}
              showRefresh={showRefreshLink && Boolean(error)}
              onRefresh={() => {
                setLoading(true);
                setError(null);
                setShowRefreshLink(false);
                loadData();
              }}
            />
          ) : (
            summaryCards.map((card) => (
              <div key={card.key} className="relative rounded-[16px] border border-slate-200 bg-white p-6 shadow-sm">
                {card.key === 'attendance' && (
                  <div className="absolute right-4 top-4 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    +2%
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-[12px] ${
                      card.key === 'totalSubjects'
                        ? 'bg-sky-100 text-sky-700'
                        : card.key === 'pendingAssignments'
                        ? 'bg-amber-100 text-amber-700'
                        : card.key === 'attendance'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-violet-100 text-violet-700'
                    }`}
                  >
                    {card.key === 'totalSubjects' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M6 4h12v4l-6 3-6-3V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 8v10h12V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {card.key === 'pendingAssignments' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M6 4h12v16H6V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M9 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                    {card.key === 'attendance' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M6 12l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {card.key === 'average' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M12 6l8 4-8 4-8-4 8-4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 10v7l8 4 8-4v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-medium text-slate-500">{card.label}</div>
                    <div className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</div>
                  </div>
                </div>
              </div>
            ))
          )}
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
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b
