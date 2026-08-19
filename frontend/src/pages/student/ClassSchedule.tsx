import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, User } from 'lucide-react';
import { getMySchedule } from '../../api/students';

const ClassSchedule = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const { data: schedule = [], isLoading, isError } = useQuery({
    queryKey: ['my-schedule'],
    queryFn: getMySchedule,
  });
  const timeSlots = [...new Set(schedule.map((entry) => `${entry.startTime} - ${entry.endTime}`))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Weekly Class Schedule</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading && <p className="p-6 text-sm text-gray-500">Loading your schedule...</p>}
        {isError && <p className="p-6 text-sm text-red-600">Could not load your schedule.</p>}
        {!isLoading && !isError && schedule.length === 0 && (
          <p className="p-6 text-sm text-gray-500">No timetable is assigned to your class yet.</p>
        )}
        {!isLoading && !isError && schedule.length > 0 && (
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
              {timeSlots.map((time) => (
                <tr key={time} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-8 align-top">
                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap">
                      {time}
                    </span>
                  </td>
                  {days.map(day => {
                    const session = schedule.find(s => s.dayOfWeek === day && `${s.startTime} - ${s.endTime}` === time);
                    return (
                      <td key={`${day}-${time}`} className="px-6 py-4 min-w-[200px]">
                        {session ? (
                          <div className="bg-blue-900 text-white p-4 rounded-xl shadow-md space-y-2 border-l-4 border-blue-400">
                            <h4 className="font-bold text-sm">{session.Subject.name}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-blue-100">
                              <User className="w-3 h-3" />
                              {session.Teacher.firstName} {session.Teacher.lastName}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-blue-100">
                              <MapPin className="w-3 h-3" />
                              {session.ClassSection.roomNumber ?? session.ClassSection.name}
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
        )}
      </div>
    </div>
  );
};

export default ClassSchedule;
