import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  BookOpen, 
  ClipboardList, 
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  User,
  ArrowRight,
  GraduationCap,
  LayoutList,
  FileText,
  Award,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from './StatCard';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import ReviewSubmissionModal, { SubmissionReviewData } from './ReviewSubmissionModal';
import { useHomeroomContext } from '../../hooks/useHomeroom';

interface TeacherDashboardData {
  assignedSubjectsCount: number;
  activeStudentsCount: number;
  assignmentsPublishedCount: number;
  publishedResultsCount: number;
  pendingExamsCount: number;
  attendance: { recordsReviewed: number; presentCount: number; absentCount: number };
  recentActions: Array<{ id: string; type: string; text: string; at: string }>;
  submittedAssignments?: SubmissionReviewData[];
}

const TeacherOverview = () => {
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionReviewData | null>(null);

  const { data: dashboard, isLoading } = useQuery<TeacherDashboardData>({
    queryKey: ['teachers', 'dashboard'],
    queryFn: () => api.get<TeacherDashboardData>('/teachers/dashboard'),
    staleTime: 2 * 60 * 1000,
  });

  // Homeroom context — shared React Query cache (also used by the Sidebar).
  // Only fires when the user is a teacher; returns isHomeroomTeacher=false
  // when they have no homeroom assignment.
  const { data: homeroomContext } = useHomeroomContext();
  const isHomeroom = !!homeroomContext?.isHomeroomTeacher;
  const homeroomSection = homeroomContext?.assignedSection;

  const submissions = dashboard?.submittedAssignments || [];

  const HOMEROOM_LINKS = [
    { label: 'Subject Results Matrix', href: '/homeroom/submissions', icon: LayoutList, desc: 'Track per-subject submission progress' },
    { label: 'Class Roster & Ranks',   href: '/homeroom/roster',      icon: Users,       desc: 'Consolidated roster with term marks' },
    { label: 'Report Cards',           href: '/homeroom/report-cards',icon: Award,       desc: 'Print and prepare student report cards' },
    { label: 'Prepare Report Cards',   href: '/homeroom/reports',     icon: FileText,    desc: 'Set conduct grades and remarks' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="My Subjects" 
          value={isLoading ? '…' : (dashboard?.assignedSubjectsCount ?? 0)} 
          icon={BookOpen} 
          iconClassName="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Active Students" 
          value={isLoading ? '…' : (dashboard?.activeStudentsCount ?? 0)} 
          icon={Users} 
          iconClassName="bg-indigo-50 text-indigo-600"
        />
        <StatCard 
          title="Submitted Assignments"
          value={isLoading ? '…' : submissions.length}
          icon={ClipboardList} 
          iconClassName="bg-amber-50 text-amber-600"
        />
        <StatCard 
          title="Pending Exam Reviews" 
          value={isLoading ? '…' : (dashboard?.pendingExamsCount ?? 0)} 
          icon={FileCheck} 
          iconClassName="bg-purple-50 text-purple-600"
        />
      </div>

      {/* ── Homeroom Quick-Access Panel (visible only to homeroom teachers) ── */}
      {isHomeroom && (
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-5 h-5 text-indigo-200" />
                <span className="text-xs font-black text-indigo-200 uppercase tracking-widest">Homeroom Teacher</span>
              </div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {(homeroomSection?.grade || homeroomSection?.gradeLevel)
                  ? `${homeroomSection.grade || homeroomSection.gradeLevel} — ${homeroomSection.name}`
                  : homeroomSection?.name ?? 'My Homeroom Class'}
              </h3>
              <p className="text-sm text-indigo-300 mt-0.5">
                {(homeroomSection?.studentCount ?? homeroomSection?.enrolledCount) != null
                  ? `${homeroomSection?.studentCount ?? homeroomSection?.enrolledCount} enrolled student${(homeroomSection?.studentCount ?? homeroomSection?.enrolledCount) === 1 ? '' : 's'}`
                  : 'Manage your homeroom section from the links below'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-indigo-700/40">
            {HOMEROOM_LINKS.map(({ label, href, icon: Icon, desc }) => (
              <Link
                key={href}
                to={href}
                className="flex flex-col items-start gap-2 p-5 bg-indigo-800/50 hover:bg-indigo-700/60 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-700 group-hover:bg-indigo-600 flex items-center justify-center transition-colors">
                  <Icon className="w-4.5 h-4.5 text-indigo-100" size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{label}</p>
                  <p className="text-xs text-indigo-300 mt-0.5 leading-snug">{desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-200 mt-auto transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

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

      {/* Submitted Assignments Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                <ClipboardList className="w-5 h-5 text-blue-900" />
                Submitted Assignments
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
                {submissions.length} submission{submissions.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Review submitted student answers, open attached documents, and assign grades.
            </p>
          </div>
          <Link
            to="/assignments"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:text-blue-950 hover:underline shrink-0"
          >
            Manage Assignments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading submitted assignments…</div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-gray-700">No submissions yet</p>
              <p className="text-xs text-gray-400 mt-1">Student submissions for your assignments will appear here once submitted.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {submissions.map((sub) => (
                <div 
                  key={sub.id} 
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 p-3 rounded-xl transition cursor-pointer"
                  onClick={() => setSelectedSubmission(sub)}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{sub.studentName}</span>
                        <span className="text-xs text-gray-400">({sub.admissionNo})</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-gray-100 text-gray-600">
                          {sub.subject}
                        </span>
                        {sub.targetClass && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-indigo-50 text-indigo-700">
                            {sub.targetClass}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-700 mt-1">
                        Assignment: {sub.assignmentTitle}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Submitted: {new Date(sub.submittedAt).toLocaleString()}
                        {sub.fileName ? ` • File: ${sub.fileName}` : ''}
                        {sub.content ? ' • Written answer provided' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className={cn(
                      "text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
                      sub.isGraded || sub.grade
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-blue-50 text-blue-800 border border-blue-200"
                    )}>
                      {sub.isGraded || sub.grade
                        ? `Graded (${sub.grade?.score}/${sub.grade?.maxScore})`
                        : "Needs Review"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubmission(sub);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Open / Review Answer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Submission Modal */}
      <ReviewSubmissionModal
        submission={selectedSubmission}
        isOpen={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onGraded={(submissionId, score, maxScore) => {
          setSelectedSubmission((prev) => prev && prev.id === submissionId ? {
            ...prev,
            isGraded: true,
            grade: { score, maxScore },
          } : prev);
        }}
      />
    </div>
  );
};

export default TeacherOverview;
