import React from 'react';
import { 
  Users, 
  UserCheck, 
  BookOpen, 
  FileCheck,
  Bell,
  Activity,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import StatCard from './StatCard';
import { MOCK_USERS, MOCK_EXAMS } from '../../data/mockData';

const AdminOverview = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={MOCK_USERS.filter(u => u.role === 'student').length} 
          icon={Users} 
          iconClassName="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Total Teachers" 
          value={MOCK_USERS.filter(u => u.role === 'teacher').length} 
          icon={UserCheck} 
          iconClassName="bg-indigo-50 text-indigo-600"
        />
        <StatCard 
          title="Total Classes" 
          value="12" 
          icon={BookOpen} 
          iconClassName="bg-amber-50 text-amber-600"
        />
        <StatCard 
          title="Pending Exam Reviews" 
          value={MOCK_EXAMS.filter(e => e.status === 'pending_approval').length + 1} 
          icon={FileCheck} 
          iconClassName="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900">Registration Activity</h3>
                <p className="text-sm text-gray-500">Student enrollment trends over the last 30 days.</p>
              </div>
              <select className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold outline-none">
                <option>Last 30 Days</option>
                <option>Last 6 Months</option>
              </select>
            </div>
            <div className="p-8 h-[300px] flex items-end gap-2">
              {[40, 60, 45, 90, 65, 80, 50, 70, 85, 95, 60, 75].map((h, i) => (
                <div key={i} className="flex-1 bg-blue-900/10 rounded-t-lg relative group transition-all hover:bg-blue-900/20">
                  <div 
                    className="absolute bottom-0 w-full bg-blue-900 rounded-t-lg transition-all"
                    style={{ height: `${h}%` }}
                  ></div>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {h} Enrollments
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest">+12% vs last month</span>
              </div>
              <h4 className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-widest">Average Attendance</h4>
              <p className="text-3xl font-black text-gray-900">94.2%</p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-widest">Target: 85% Average</span>
              </div>
              <h4 className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-widest">School Wide Average</h4>
              <p className="text-3xl font-black text-gray-900">85.4%</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-500" />
                System Alerts
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { title: 'New Exam Submission', desc: 'Meron Tadesse submitted Physics Final for review', time: '10m ago', urgent: true },
                { title: 'Teacher Account Request', desc: 'Solomon Tesfaye requested access to Math Dept', time: '1h ago', urgent: false },
                { title: 'System Maintenance', desc: 'Portal will be offline Sunday 2AM-4AM', time: '5h ago', urgent: false },
              ].map((alert, i) => (
                <div key={i} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h4 className="text-sm font-bold text-gray-900 leading-tight">{alert.title}</h4>
                    {alert.urgent && <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{alert.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{alert.time}</span>
                    <button className="text-[10px] font-black text-blue-900 uppercase tracking-widest hover:underline flex items-center gap-1">
                      Action
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
