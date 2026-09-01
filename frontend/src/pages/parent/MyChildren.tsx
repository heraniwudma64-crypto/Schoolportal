import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParent } from '../../context/ParentContext';
import { ParentChildSummary, getChildAttendance, getChildResults, getChildAssignments } from '../../api/parents';
import { 
  Users, 
  GraduationCap, 
  CheckSquare, 
  ClipboardList, 
  Calendar, 
  FileCheck, 
  Check, 
  Sparkles, 
  RefreshCw, 
  Phone, 
  MapPin, 
  BookOpen, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// Micro-component to fetch and render quick stats for each child card
const ChildCardStats: React.FC<{ childId: string }> = ({ childId }) => {
  const { data: attendance, isLoading: attLoading } = useQuery({
    queryKey: ['parent-child-attendance', childId],
    queryFn: () => getChildAttendance(childId),
  });

  const { data: results, isLoading: resLoading } = useQuery({
    queryKey: ['parent-child-results', childId],
    queryFn: () => getChildResults(childId),
  });

  const { data: assignments, isLoading: asgLoading } = useQuery({
    queryKey: ['parent-child-assignments', childId],
    queryFn: () => getChildAssignments(childId),
  });

  const attPercentage = attendance?.summary?.attendancePercentage;
  const avg = results?.overallAverage;
  const pendingCount = assignments?.pendingCount ?? 0;

  return (
    <div className="grid grid-cols-3 gap-2 py-3 px-3.5 bg-gray-50/90 rounded-2xl border border-gray-100/80 text-center">
      <div className="flex flex-col items-center justify-center">
        <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
          <CheckSquare className="w-3 h-3 text-emerald-600" />
          Attendance
        </span>
        <span className="text-sm font-black text-gray-900 mt-0.5">
          {attLoading ? '…' : attPercentage !== undefined ? `${attPercentage}%` : '100%'}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center border-x border-gray-200/60 px-1">
        <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
          <GraduationCap className="w-3 h-3 text-purple-600" />
          Average
        </span>
        <span className="text-sm font-black text-gray-900 mt-0.5">
          {resLoading ? '…' : avg !== undefined && results?.totalRecords ? `${avg}%` : '—'}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center">
        <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
          <ClipboardList className="w-3 h-3 text-amber-600" />
          Pending
        </span>
        <span className="text-sm font-black text-gray-900 mt-0.5">
          {asgLoading ? '…' : `${pendingCount} Asgn`}
        </span>
      </div>
    </div>
  );
};

const MyChildren: React.FC = () => {
  const { childrenList, selectedChildId, setSelectedChildId, isLoading, error, refetchChildren } = useParent();
  const navigate = useNavigate();

  const handleNavigateWithActiveChild = (childId: string, path: string) => {
    setSelectedChildId(childId);
    navigate(path);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-gray-500">Loading student profiles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-red-700 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-red-900">Failed to load student profiles</h3>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => void refetchChildren()}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 0: Empty state (0 children linked)
  if (childrenList.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="p-10 bg-white rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">No Linked Students Found</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            There are currently no student accounts linked to your guardian profile. Please contact the school administration to have your children linked to your account.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => void refetchChildren()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Status
            </button>
            <Link
              to="/account"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              My Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">My Children</h1>
            <span className="px-3 py-0.5 bg-blue-100 text-blue-900 font-bold text-xs rounded-full">
              {childrenList.length} {childrenList.length === 1 ? 'Student' : 'Students'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Overview and profiles of all students linked to your guardian account.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refetchChildren()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
          Refresh
        </button>
      </div>

      {/* Children Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {childrenList.map((child) => {
          const isSelected = child.id === selectedChildId;
          const sectionName = child.classSection?.name || child.currentEnrollment?.classSection || 'Enrolled';
          const gradeLevel = child.classSection?.gradeLevel || child.currentEnrollment?.gradeLevel || 'Standard';
          const academicYear = child.currentEnrollment?.academicYear || 'Current Academic Year';
          const roomNumber = child.classSection?.roomNumber;

          return (
            <div
              key={child.id}
              className={`bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md'
                  : 'border-gray-200/80 hover:border-blue-300'
              }`}
            >
              {/* Card Header & Demographics */}
              <div className="p-6 space-y-5">
                {/* Child Identity Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-900 to-blue-800 text-white flex items-center justify-center font-bold text-xl shadow-xs flex-shrink-0">
                      {child.avatarUrl ? (
                        <img src={child.avatarUrl} alt={child.fullName} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        child.firstName.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-black text-gray-900">{child.fullName}</h3>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold text-[10px] rounded-md uppercase">
                          {child.status || 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Admission ID: <span className="font-mono text-gray-700 font-semibold">{child.admissionNo}</span>
                      </p>
                    </div>
                  </div>

                  {/* Active Indicator Badge */}
                  {isSelected && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-900 text-white text-xs font-bold rounded-full shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Active
                    </span>
                  )}
                </div>

                {/* Enrollment & Academic Info Pill Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Class Section</span>
                    <span className="font-bold text-blue-950 mt-0.5 block">{sectionName}</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Grade Level</span>
                    <span className="font-bold text-gray-900 mt-0.5 block">{gradeLevel}</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Academic Year</span>
                    <span className="font-bold text-gray-700 mt-0.5 block truncate">{academicYear}</span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Room & Gender</span>
                    <span className="font-bold text-gray-700 mt-0.5 block">
                      {roomNumber ? `Room ${roomNumber}` : 'Standard'} • {child.gender || 'Student'}
                    </span>
                  </div>
                </div>

                {/* Safe Extra Demographics if available */}
                {(child.emergencyContact || child.address) && (
                  <div className="space-y-1 text-xs text-gray-500 pt-1 border-t border-gray-100">
                    {child.emergencyContact && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span>Emergency: <strong className="text-gray-700">{child.emergencyContact}</strong></span>
                      </div>
                    )}
                    {child.address && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">Address: {child.address}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Real Quick Stats Widget */}
                <ChildCardStats childId={child.id} />
              </div>

              {/* Card Footer & Academic Shortcuts */}
              <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex flex-col gap-3">
                {/* Active Student Switch Button */}
                {isSelected ? (
                  <div className="w-full py-2 px-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    Currently Active in Dashboard & Header
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedChildId(child.id)}
                    className="w-full py-2 px-3 bg-white hover:bg-blue-900 hover:text-white border border-gray-200 hover:border-blue-900 rounded-xl text-xs font-bold text-gray-700 shadow-xs transition-all flex items-center justify-center gap-2 group"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 group-hover:text-white transition-colors" />
                    Select as Active Student
                  </button>
                )}

                {/* Quick Academic Navigation Links */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleNavigateWithActiveChild(child.id, '/parent/results')}
                    className="py-1.5 px-2 bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-200 rounded-lg text-[11px] font-bold text-gray-700 hover:text-purple-700 transition-colors text-center"
                  >
                    Results
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateWithActiveChild(child.id, '/parent/attendance')}
                    className="py-1.5 px-2 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 rounded-lg text-[11px] font-bold text-gray-700 hover:text-emerald-700 transition-colors text-center"
                  >
                    Attendance
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateWithActiveChild(child.id, '/parent/schedule')}
                    className="py-1.5 px-2 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-lg text-[11px] font-bold text-gray-700 hover:text-indigo-700 transition-colors text-center"
                  >
                    Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateWithActiveChild(child.id, '/parent/report-card')}
                    className="py-1.5 px-2 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg text-[11px] font-bold text-gray-700 hover:text-blue-700 transition-colors text-center"
                  >
                    Report
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyChildren;
