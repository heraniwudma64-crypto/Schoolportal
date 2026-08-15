import React from 'react';
import { MOCK_SCHEDULE } from '../../data/mockData';
import { Clock, MapPin, User } from 'lucide-react';

const ClassSchedule = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Weekly Class Schedule</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-sm font-bold text-gray-900">Time / Day</th>
                {days.map(day => (
                  <th key={day} className="px-6 py-4 text-sm font-bold text-gray-900">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* This is a simplified view, in a real app we would map by time slots */}
              {['08:00 - 09:30', '10:00 - 11:30', '12:00 - 01:30', '02:00 - 03:30'].map((time) => (
                <tr key={time} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-8 align-top">
                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap">
                      {time}
                    </span>
                  </td>
                  {days.map(day => {
                    const session = MOCK_SCHEDULE.find(s => s.day === day && s.time === time);
                    return (
                      <td key={`${day}-${time}`} className="px-6 py-4 min-w-[200px]">
                        {session ? (
                          <div className="bg-blue-900 text-white p-4 rounded-xl shadow-md space-y-2 border-l-4 border-blue-400">
                            <h4 className="font-bold text-sm">{session.subjectName}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-blue-100">
                              <User className="w-3 h-3" />
                              {session.teacherName}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-blue-100">
                              <MapPin className="w-3 h-3" />
                              {session.room}
                            </div>
                          </div>
                        ) : (
                          <div className="h-24 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100 flex items-center justify-center text-xs text-gray-300">
                            No Class
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClassSchedule;
