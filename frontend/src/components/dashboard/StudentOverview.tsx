import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BookOpen, 
  ClipboardList, 
  CheckSquare, 
  GraduationCap, 
  Bell,
  Calendar,
  Clock
} from 'lucide-react';
import StatCard from './StatCard';
import { getUserNotices } from '../../api/notices';
import { getMyAttendance, getMyCourses, getMyResults, getMyAssignments } from '../../api/students';

const StudentOverview = () => {
  const { data: notices = [], isLoading: noticesLoading, isError: noticesError } = useQuery({
    queryKey: ['student-notices'],
    queryFn: getUserNotices,
  });
  const { data: courses = [], isLoading: coursesLoading, isError: coursesError } = useQuery({
    queryKey: ['my-courses'],
    queryFn: getMyCourses,
  });
  const { data: attendance = [], isLoading: attendanceLoading, isError: attendanceError } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: getMyAttendance,
  });
  const { data: results, isLoading: resultsLoading, isError: resultsError } = useQuery({
    queryKey: ['my-results'],
    queryFn: getMyResults,
  });
  const { data: assignments = [], isLoading: assignmentsLoading, isError: assignmentsError } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: getMyAssignments,
  });

  const presentDays = attendance.filter((record) => record.status === 'PRESENT').length;
  const attendancePercentage = attendance.length ? (presentDays / attendance.length) * 100 : null;

  // Calculate academic average safely from finalized subjectResults, or fallback to component grades
  const subjectResults = results?.subjectResults || [];
  const grades = results?.grades || [];
  let average: number | null = null;
  if (subjectResults.length > 0) {
    const total = subjectResults.reduce((sum, r) => sum + (Number(r.marks) || 0), 0);
    average = total / subjectResults.length;
  } else if (grades.length > 0) {
    const total = grades.reduce((sum, g) => sum + (Number(g.score) || 0), 0);
    average = total / grades.length;
  }

  const pendingAssignments = assignments.filter((a) => !a.submissions || a.submissions.length === 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Subjects" 
          value={coursesLoading ? '…' : coursesError ? '—' : courses.length}
          icon={BookOpen} 
          iconClassName="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Pending Assignments" 
          value={assignmentsLoading ? '…' : assignmentsError ? '—' : pendingAssignments.length} 
          icon={ClipboardList} 
          iconClassName="bg-amber-50 text-amber-600"
        />
        <StatCard 
          title="Attendance" 
          value={attendanceLoading ? '…' : attendanceError || attendancePercentage === null ? '—' : `${attendancePercentage.toFixed(1)}%`}
          icon={CheckSquare} 
          iconClassName="bg-green-50 text-green-600"
        />
        <StatCard 
          title="Average" 
          value={resultsLoading ? '…' : resultsError || average === null ? '—' : `${average.toFixed(1)}%`}
          icon={GraduationCap} 
          iconClassName="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Announcements */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Recent Announcements
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {noticesLoading && (
              <p className="p-6 text-sm text-gray-500">Loading announcements...</p>
            )}
            {noticesError && (
              <p className="p-6 text-sm text-red-600">Could not load announcements.</p>
            )}
            {!noticesLoading && !noticesError && notices.length === 0 && (
              <p className="p-6 text-sm text-gray-500">No announcements for you yet.</p>
            )}
            {notices.slice(0, 5).map((ann) => (
              <div key={ann.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{ann.title}</h4>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(ann.publishedAt ?? ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Upcoming Deadlines
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {assignmentsLoading && (
              <p className="text-sm text-gray-500">Loading deadlines...</p>
            )}
            {assignmentsError && (
              <p className="text-sm text-red-600">Could not load deadlines.</p>
            )}
            {!assignmentsLoading && !assignmentsError && pendingAssignments.length === 0 && (
              <p className="text-sm text-gray-500">No pending deadlines.</p>
            )}
            {pendingAssignments.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{a.title}</h4>
                  <p className="text-xs text-gray-500">
                    {a.ClassSection?.name || a.targetClass || 'General'} • Due {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No date'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;
