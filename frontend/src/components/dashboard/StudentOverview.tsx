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
import { MOCK_SUBJECTS, MOCK_ASSIGNMENTS } from '../../data/mockData';
import { getUserNotices } from '../../api/notices';

const StudentOverview = () => {
  const { data: notices = [], isLoading: noticesLoading } = useQuery({
    queryKey: ['student-notices'],
    queryFn: getUserNotices,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Subjects" 
          value={MOCK_SUBJECTS.length} 
          icon={BookOpen} 
          iconClassName="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Pending Assignments" 
          value={MOCK_ASSIGNMENTS.filter(a => a.status === 'pending').length} 
          icon={ClipboardList} 
          iconClassName="bg-amber-50 text-amber-600"
        />
        <StatCard 
          title="Attendance" 
          value="95%" 
          icon={CheckSquare} 
          iconClassName="bg-green-50 text-green-600"
          trend={{ value: "+2%", isUp: true }}
        />
        <StatCard 
          title="Average" 
          value="95%" 
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
            <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
          </div>
          <div className="divide-y divide-gray-100">
            {noticesLoading && (
              <p className="p-6 text-sm text-gray-500">Loading announcements...</p>
            )}
            {!noticesLoading && notices.length === 0 && (
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
            {MOCK_ASSIGNMENTS.filter(a => a.status === 'pending').map((a) => (
              <div key={a.id} className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{a.title}</h4>
                  <p className="text-xs text-gray-500">{a.subjectName} • Due {a.dueDate}</p>
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
