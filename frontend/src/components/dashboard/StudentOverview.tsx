import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BookOpen, 
  ClipboardList, 
  CheckSquare, 
  GraduationCap, 
  Calendar,
  Clock
} from 'lucide-react';
import StatCard from './StatCard';
import { getUserNotices } from '../../api/notices';
import { getMyAttendance, getMyCourses, getMyResults, getMyAssignments } from '../../api/students';
import StudentVideoLessons from './StudentVideoLessons';

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

  const attendanceList = Array.isArray(attendance) ? attendance : [];
  const presentDays = attendanceList.filter((record: any) => record.status === 'PRESENT').length;
  const attendancePercentage = attendanceList.length ? (presentDays / attendanceList.length) * 100 : null;

  // Calculate academic average safely from finalized subjectResults, or fallback to component grades
  const subjectResults = (results as any)?.subjectResults || [];
  const grades = (results as any)?.grades || (Array.isArray(results) ? results : []);
  let average: number | null = null;
  if (subjectResults.length > 0) {
    const total = subjectResults.reduce((sum: number, r: any) => sum + (Number(r.marks) || 0), 0);
    average = total / subjectResults.length;
  } else if (grades.length > 0) {
    const total = grades.reduce((sum: number, g: any) => sum + (Number(g.score ?? g.marksObtained) || 0), 0);
    average = total / grades.length;
  }

  const assignmentList = Array.isArray(assignments) ? assignments : [];
  const pendingAssignments = assignmentList.filter((a: any) => !a.submissions || a.submissions.length === 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Subjects" 
          value={coursesLoading ? '…' : coursesError ? '—' : (Array.isArray(courses) ? courses.length : 0)}
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
              Recent Announcements
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {noticesLoading && (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-50 rounded w-3/4" />
                  </div>
                ))}
              </div>
            )}
            {noticesError && (
              <p className="p-6 text-sm text-red-600">Could not load announcements.</p>
            )}
            {!noticesLoading && !noticesError && notices.length === 0 && (
              <p className="p-6 text-sm text-gray-500">No announcements for you yet.</p>
            )}
            {!noticesLoading && notices.slice(0, 5).map((ann) => (
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

      {/* Educational YouTube Video Lessons */}
      <StudentVideoLessons />
    </div>
  );
};

export default StudentOverview;
