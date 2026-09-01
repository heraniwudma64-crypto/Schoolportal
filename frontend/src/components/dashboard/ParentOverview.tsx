import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useParent } from '../../context/ParentContext';
import { 
  Users, 
  CheckSquare, 
  GraduationCap, 
  ClipboardList, 
  Calendar, 
  Clock, 
  BookOpen, 
  AlertCircle,
  TrendingUp,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import StatCard from './StatCard';
import { ChildSelector } from '../parent/ChildSelector';
import { 
  getChildAttendance, 
  getChildResults, 
  getChildAssignments, 
  getChildSchedule 
} from '../../api/parents';
import { Link } from 'react-router-dom';

const ParentOverview = () => {
  const { user } = useAuth();
  const { childrenList, selectedChild, selectedChildId, isLoading: parentLoading, error: parentError } = useParent();

  // Queries for active selected child
  const { 
    data: attendanceData, 
    isLoading: attendanceLoading 
  } = useQuery({
    queryKey: ['parent-child-attendance', selectedChildId],
    queryFn: () => (selectedChildId ? getChildAttendance(selectedChildId) : null),
    enabled: !!selectedChildId,
  });

  const { 
    data: resultsData, 
    isLoading: resultsLoading 
  } = useQuery({
    queryKey: ['parent-child-results', selectedChildId],
    queryFn: () => (selectedChildId ? getChildResults(selectedChildId) : null),
    enabled: !!selectedChildId,
  });

  const { 
    data: assignmentsData, 
    isLoading: assignmentsLoading 
  } = useQuery({
    queryKey: ['parent-child-assignments', selectedChildId],
    queryFn: () => (selectedChildId ? getChildAssignments(selectedChildId) : null),
    enabled: !!selectedChildId,
  });

  const { 
    data: scheduleData, 
    isLoading: scheduleLoading 
  } = useQuery({
    queryKey: ['parent-child-schedule', selectedChildId],
    queryFn: () => (selectedChildId ? getChildSchedule(selectedChildId) : null),
    enabled: !!selectedChildId,
  });

  if (parentLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (parentError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{parentError}</span>
      </div>
    );
  }

  // Case 0: Parent with zero linked children
  if (childrenList.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 text-center">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            There are currently no student accounts linked to your guardian profile. Please contact the school administration to assign your children.
          </p>
          <div className="pt-2">
            <Link
              to="/account"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors"
            >
              View My Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const childName = selectedChild?.firstName || 'Student';
  const attendanceRate = attendanceData?.summary?.attendancePercentage;
  const overallAvg = resultsData?.overallAverage;
  const pendingAssignments = assignmentsData?.pendingCount ?? 0;
  const recentGrades = resultsData?.grades?.slice(0, 4) || [];
  const upcomingAssignments = assignmentsData?.assignments?.filter((a) => a.submissionStatus === 'PENDING').slice(0, 4) || [];
  const scheduleSlots = scheduleData?.schedule?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Parent Dashboard</span>
          <h1 className="text-2xl sm:text-3xl font-black">
            Welcome, {user?.name}!
          </h1>
          <p className="text-sm text-blue-100">
            Monitoring academic progress and attendance for <strong className="text-white underline decoration-blue-400">{selectedChild?.fullName}</strong>.
          </p>
        </div>

        {/* Header Child Selector if multiple children */}
        {childrenList.length > 1 && (
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/15 flex items-center gap-3">
            <span className="text-xs font-semibold text-blue-100 pl-2 hidden sm:inline">Active Child:</span>
            <ChildSelector />
          </div>
        )}
      </div>

      {/* 4 Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Linked Children" 
          value={childrenList.length}
          icon={Users} 
          iconClassName="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Attendance Rate" 
          value={attendanceLoading ? '…' : attendanceRate !== undefined ? `${attendanceRate}%` : '100%'}
          icon={CheckSquare} 
          iconClassName="bg-emerald-50 text-emerald-600"
        />
        <StatCard 
          title="Academic Average" 
          value={resultsLoading ? '…' : overallAvg !== undefined && resultsData?.totalRecords ? `${overallAvg}%` : '—'}
          icon={GraduationCap} 
          iconClassName="bg-purple-50 text-purple-600"
        />
        <StatCard 
          title="Pending Assignments" 
          value={assignmentsLoading ? '…' : pendingAssignments}
          icon={ClipboardList} 
          iconClassName="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Two Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Recent Grades & Schedule Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Recorded Grades */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Recent Academic Results ({childName})
              </h3>
              <Link to="/parent/results" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {resultsLoading && (
                <p className="p-6 text-sm text-gray-500">Loading student grades...</p>
              )}
              {!resultsLoading && recentGrades.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No academic grades recorded for {childName} yet.
                </div>
              )}
              {recentGrades.map((grade) => (
                <div key={grade.id} className="p-4 sm:px-6 hover:bg-gray-50/60 transition-colors flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-gray-900 text-sm">{grade.subject}</h4>
                    <p className="text-xs text-gray-500">
                      {grade.quarter ? `Quarter ${grade.quarter}` : 'General'} • Mid: {grade.mid} | Asgn: {grade.assignment} | Quiz: {grade.quiz} | Final: {grade.final}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-blue-900">{grade.score}%</span>
                    <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                      {grade.gradeLetter}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule / Timetable Preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Class Schedule Preview ({selectedChild?.classSection?.name || 'Class'})
              </h3>
              <Link to="/parent/schedule" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                Full Timetable <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="p-6">
              {scheduleLoading && <p className="text-sm text-gray-500">Loading schedule slots...</p>}
              {!scheduleLoading && scheduleSlots.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No scheduled timetable periods found for this class.</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scheduleSlots.map((slot) => (
                  <div key={slot.id} className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-gray-900 text-xs">{slot.subjectName}</h5>
                      <p className="text-[11px] text-gray-500 mt-0.5">{slot.teacherName} • Room {slot.roomNumber}</p>
                    </div>
                    <span className="text-[11px] font-mono font-semibold bg-white text-gray-700 px-2 py-1 rounded-md border border-gray-200">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Pending Assignments & Student Profile Details */}
        <div className="space-y-6">
          {/* Pending / Upcoming Homework */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Upcoming Assignments
              </h3>
              <Link to="/parent/assignments" className="text-xs text-blue-600 font-bold hover:underline">
                View All
              </Link>
            </div>
            <div className="p-6 space-y-3">
              {assignmentsLoading && <p className="text-sm text-gray-500">Loading assignments...</p>}
              {!assignmentsLoading && upcomingAssignments.length === 0 && (
                <div className="text-center py-4 text-sm text-gray-500">
                  No pending assignments for {childName}.
                </div>
              )}
              {upcomingAssignments.map((a) => (
                <div key={a.id} className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-gray-900">{a.title}</h5>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                      Due {new Date(a.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600">{a.subject || 'General'} • {a.teacherName || 'Teacher'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Student Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {selectedChild?.firstName?.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{selectedChild?.fullName}</h4>
                <p className="text-xs text-gray-500">Admission No: {selectedChild?.admissionNo}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Class Section</span>
                <span className="font-semibold text-gray-900">{selectedChild?.classSection?.name || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Grade Level</span>
                <span className="font-semibold text-gray-900">{selectedChild?.classSection?.gradeLevel || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Gender</span>
                <span className="font-semibold text-gray-900">{selectedChild?.gender || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Status</span>
                <span className="font-bold text-emerald-600 uppercase">{selectedChild?.status || 'ACTIVE'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentOverview;
