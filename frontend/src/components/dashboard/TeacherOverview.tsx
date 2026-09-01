import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  ClipboardList, 
  FileCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import StatCard from './StatCard';
import { MOCK_SUBJECTS, MOCK_ASSIGNMENTS } from '../../data/mockData';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

const TeacherOverview = () => {
  const [dashboard, setDashboard] = useState<{ assignedSubjectsCount: number; activeStudentsCount: number; assignmentsPublishedCount: number; pendingExamsCount: number; attendance: { recordsReviewed: number; presentCount: number; absentCount: number }; recentActions: Array<{ id: string; type: string; text: string; at: string }> } | null>(null);

  useEffect(() => {
    api.get<typeof dashboard>('/teachers/dashboard').then(setDashboard).catch(() => setDashboard(null));
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="My Subjects" 
          value={dashboard?.assignedSubjectsCount ?? 0} 
          icon={BookOpen} 
          iconClassName="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Active Students" 
          value={dashboard?.activeStudentsCount ?? 0} 
          icon={Users} 
          iconClassName="bg-indigo-50 text-indigo-600"
        />
        <StatCard 
          title="Assignments Published" 
          value={dashboard?.assignmentsPublishedCount ?? 0} 
          icon={ClipboardList} 
          iconClassName="bg-amber-50 text-amber-600"
        />
        <StatCard 
          title="Pending Exam Reviews" 
          value={dashboard?.pendingExamsCount ?? 0} 
          icon={FileCheck} 
          iconClassName="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Main Grid: Attendance & Recent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Today's Attendance Overview
            </h3>
              <span className="text-sm text-blue-600 font-medium">{dashboard?.attendance.recordsReviewed ?? 0} records reviewed</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { class: 'Assigned sections', subject: 'Attendance records', time: 'Current review', status: 'Completed', present: `${dashboard?.attendance.presentCount ?? 0} present/late` },
                { class: 'Assigned sections', subject: 'Attendance follow-up', time: 'Current review', status: 'Upcoming', present: `${dashboard?.attendance.absentCount ?? 0} absent` },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-900 bg-blue-50 px-2 py-1 rounded uppercase tracking-widest">{item.class}</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest",
                      item.status === 'Completed' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {item.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{item.subject}</h4>
                    <p className="text-xs text-gray-400">{item.time}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">Present: <span className="font-bold text-gray-900">{item.present}</span></span>
                    {item.status === 'Completed' ? (
                      <button className="text-xs font-bold text-blue-600 hover:underline">Edit</button>
                    ) : (
                      <button className="text-xs font-bold text-white bg-blue-900 px-3 py-1 rounded-lg">Start Session</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-purple-600" />
              Recent Actions
            </h3>
          </div>
          <div className="p-6 space-y-6">
            {(dashboard?.recentActions ?? []).map((action) => {
              const Icon = action.type === 'exam' ? FileCheck : ClipboardList;
              const color = action.type === 'exam' ? 'text-purple-600' : 'text-amber-600';
              return (
              <div key={action.id} className="flex gap-4">
                <div className={cn("w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0", color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{action.text}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(action.at).toLocaleString()}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherOverview;
