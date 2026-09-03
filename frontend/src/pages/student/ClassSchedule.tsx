import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Printer,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAcademicYears } from '../../hooks/useAcademicStructure';
import { useStudentSchedule } from '../../hooks/useTimetable';
import { WeeklyScheduleGrid } from '../../components/admin/timetable/WeeklyScheduleGrid';

export const ClassSchedule: React.FC = () => {
  // 1. Academic Year selection
  const {
    data: academicYears = [],
    isLoading: loadingYears,
  } = useAcademicYears();

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');

  // Default to current academic year once loaded
  useEffect(() => {
    if (!selectedAcademicYearId && academicYears.length > 0) {
      const current = academicYears.find((y) => y.isCurrent) || academicYears[0];
      setSelectedAcademicYearId(current.id);
    }
  }, [academicYears, selectedAcademicYearId]);

  const selectedYear = useMemo(() => {
    return academicYears.find((y) => y.id === selectedAcademicYearId);
  }, [academicYears, selectedAcademicYearId]);

  // 2. Student Timetable Query
  const {
    data: scheduleData,
    isLoading: loadingSchedule,
    isError: errorSchedule,
    refetch: refetchSchedule,
  } = useStudentSchedule(selectedAcademicYearId || undefined);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  const isLoading = loadingYears || loadingSchedule;
  const hasEnrollment = !!scheduleData?.classSection;
  const entriesCount = scheduleData?.entries?.length ?? 0;
  const periods = scheduleData?.periods ?? [];

  return (
    <div className="space-y-6">
      {/* ─── 1. Header Section ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-900 text-white rounded-2xl shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Class Schedule
              </h1>
              <p className="text-xs sm:text-sm font-medium text-gray-500">
                View your weekly class timetable, lesson periods, and assigned rooms.
              </p>
            </div>
          </div>
        </div>

        {/* Header Controls: Academic Year Selector + Print Action */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Academic Year Selector */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-1.5 shadow-xs">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Year:
            </span>
            <select
              aria-label="Select Academic Year"
              value={selectedAcademicYearId}
              onChange={(e) => setSelectedAcademicYearId(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer pr-1"
            >
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year} {year.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Print Action */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="rounded-2xl text-xs font-bold border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs"
            aria-label="Print timetable"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print
          </Button>
        </div>
      </div>

      {/* ─── Print Specific Styles ─── */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          nav, aside, header, .fixed, .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* ─── Printable Header (Visible only when printing) ─── */}
      <div className="hidden print:block mb-6 border-b border-gray-300 pb-4">
        <h1 className="text-xl font-black text-gray-900">
          School Portal — Student Class Schedule
        </h1>
        <p className="text-xs text-gray-700 mt-1 font-medium">
          Student: {scheduleData?.student?.fullName || 'Student'}
          {scheduleData?.student?.admissionNo && ` • Admission No: ${scheduleData.student.admissionNo}`}
          {scheduleData?.classSection?.name && ` • Class Section: ${scheduleData.classSection.name}`}
          {scheduleData?.classSection?.gradeLevel && ` (${scheduleData.classSection.gradeLevel})`}
          {selectedYear && ` • Academic Year: ${selectedYear.year}`}
          {` • Total Weekly Lessons: ${entriesCount}`}
        </p>
      </div>

      {/* ─── 2. Status Ribbon ─── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        {/* Student Identity Badge & Info */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-900 font-black text-xs flex items-center justify-center border border-blue-200">
              {scheduleData?.student?.fullName ? scheduleData.student.fullName.charAt(0) : 'S'}
            </div>
            <div>
              <span className="text-xs font-black text-gray-900 block leading-tight">
                {scheduleData?.student?.fullName || 'Authenticated Student'}
              </span>
              {scheduleData?.student?.admissionNo && (
                <span className="text-[10px] font-bold text-gray-400 block font-mono">
                  ID: {scheduleData.student.admissionNo}
                </span>
              )}
            </div>
          </div>

          <div className="h-4 w-px bg-gray-200 hidden sm:block" />

          {/* Class Section & Grade Badge */}
          {scheduleData?.classSection && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
              <GraduationCap className="w-3.5 h-3.5 text-gray-600" />
              {scheduleData.classSection.gradeLevel ? `${scheduleData.classSection.gradeLevel} • ` : ''}
              Section {scheduleData.classSection.name}
              {scheduleData.classSection.roomNumber && ` (Room ${scheduleData.classSection.roomNumber})`}
            </span>
          )}

          {/* Total Weekly Lessons Pill */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200/60">
            <Sparkles className="w-3.5 h-3.5 text-blue-700" />
            {entriesCount} Scheduled Weekly Lessons
          </span>
        </div>

        {/* Academic Year Indicator Pill */}
        <div className="text-xs font-bold text-gray-500 flex items-center gap-1.5 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>Academic Year: {selectedYear?.year || 'Current Year'}</span>
        </div>
      </div>

      {/* ─── 3. Main Workspace ─── */}
      <div className="space-y-4">
        {isLoading ? (
          /* Loading Skeleton */
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4 animate-pulse">
            <div className="h-12 bg-gray-100 rounded-2xl w-full" />
            <div className="h-20 bg-gray-50 rounded-2xl w-full" />
            <div className="h-20 bg-gray-50 rounded-2xl w-full" />
            <div className="h-10 bg-amber-50/50 rounded-2xl w-full" />
            <div className="h-20 bg-gray-50 rounded-2xl w-full" />
          </div>
        ) : errorSchedule ? (
          /* Error State with Retry */
          <div className="bg-red-50/80 border border-red-200 rounded-3xl p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <h3 className="text-sm font-bold text-red-900">Unable to load your schedule.</h3>
            <p className="text-xs text-red-600 max-w-sm mx-auto">
              There was a problem retrieving your published timetable. Please try again.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetchSchedule()}
              className="rounded-xl border-red-200 text-red-800 hover:bg-red-100/50 text-xs font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
            </Button>
          </div>
        ) : !hasEnrollment ? (
          /* No Active Enrollment Empty State */
          <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No active enrollment found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {scheduleData?.message ||
                'No active enrollment was found for you in this academic year. Please select another academic year or contact administration.'}
            </p>
          </div>
        ) : entriesCount === 0 ? (
          /* No Published Timetable Empty State */
          <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No published timetable available</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {scheduleData?.message ||
                'Your class does not have a published timetable yet. When the administration publishes your schedule, your weekly timetable will appear here.'}
            </p>
          </div>
        ) : (
          /* Weekly Schedule Grid View */
          <WeeklyScheduleGrid
            periods={periods}
            entries={scheduleData.entries}
            sectionName={scheduleData.classSection?.name}
            roomNumber={scheduleData.classSection?.roomNumber}
            readOnly={true}
          />
        )}
      </div>
    </div>
  );
};

export default ClassSchedule;
