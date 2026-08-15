import React from 'react';
import { 
  Users, 
  TrendingUp, 
  Award, 
  Target,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const Performance = () => {
  const data = [
    { name: 'G-10A', avg: 85, top: 98 },
    { name: 'G-10B', avg: 78, top: 95 },
    { name: 'G-11A', avg: 82, top: 97 },
    { name: 'G-11B', avg: 88, top: 99 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Academic Performance</h2>
          <p className="text-gray-500 mt-1">Visualize student progress and class-wide performance metrics.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-3 px-6 py-3 bg-gray-50 text-gray-900 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6 group hover:border-blue-900/20 transition-all">
          <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 shrink-0 shadow-lg shadow-blue-600/5 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Average Score</p>
            <h3 className="text-2xl font-black text-gray-900">83.2%</h3>
            <p className="text-xs text-green-600 font-bold mt-1">+2.4% vs last term</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6 group hover:border-indigo-900/20 transition-all">
          <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shrink-0 shadow-lg shadow-indigo-600/5 group-hover:scale-110 transition-transform">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Top Performance</p>
            <h3 className="text-2xl font-black text-gray-900">Grade 11B</h3>
            <p className="text-xs text-indigo-600 font-bold mt-1">98.5% Highest Individual</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6 group hover:border-amber-900/20 transition-all">
          <div className="w-16 h-16 bg-amber-50 rounded-[1.5rem] flex items-center justify-center text-amber-600 shrink-0 shadow-lg shadow-amber-600/5 group-hover:scale-110 transition-transform">
            <Target className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Submission Rate</p>
            <h3 className="text-2xl font-black text-gray-900">94.1%</h3>
            <p className="text-xs text-amber-600 font-bold mt-1">246/261 Students</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-gray-900">Class Averages</h3>
            <div className="flex gap-2">
              <button className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-blue-900 transition-all">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="avg" fill="#1e3a8a" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-gray-900">Growth Trend</h3>
            <span className="text-[10px] font-black text-blue-900 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Yearly View</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { month: 'Sep', value: 72 },
                { month: 'Oct', value: 75 },
                { month: 'Nov', value: 81 },
                { month: 'Dec', value: 79 },
                { month: 'Jan', value: 84 },
                { month: 'Feb', value: 88 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;
