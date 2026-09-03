import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParent } from '../../context/ParentContext';
import { getChildResults, ChildGradeRecord, ChildExamAttemptRecord } from '../../api/parents';
import { 
  GraduationCap, 
  TrendingUp, 
  BookOpen, 
  Award, 
  FileText, 
  Users, 
  AlertCircle, 
  RefreshCw, 
  Sparkles,
  ArrowUpDown,
  CheckCircle2
} from 'lucide-react';
import { ChildSelector } from '../../components/parent/ChildSelector';
import StatCard from '../../components/dashboard/StatCard';
import { Link } from 'react-router-dom';

const ParentResults: React.FC = () => {
  const { 
    childrenList, 
    selectedChild, 
    selectedChildId, 
    isLoading: parentLoading, 
    error: parentError, 
    refetchChildren 
  } = useParent();

  const [quarterFilter, setQuarterFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Query child results for active selected child
  const {
    data: resultsData,
    isLoading: resultsLoading,
    isError: resultsError,
    error: fetchError,
    refetch: refetchResults,
  } = useQuery({
    queryKey: ['parent-child-results-page', selectedChildId],
    queryFn: () => (selectedChildId ? getChildResults(selectedChildId) : null),
    enabled: !!selectedChildId,
  });

  // Filtered grades list
  const filteredGrades = useMemo(() => {
    if (!resultsData?.grades) return [];
    let list = [...resultsData.grades];

    if (quarterFilter !== 'ALL') {
      list = list.filter((g) => {
        const qStr = String(g.quarter).toLowerCase();
        return qStr.includes(quarterFilter.toLowerCase()) || qStr === quarterFilter.toLowerCase();
      });
    }

    list.sort((a, b) => {
      return sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
    });

    return list;
  }, [resultsData?.grades, quarterFilter, sortOrder]);

  const examAttempts = resultsData?.examAttempts || [];

  if (parentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-gray-500">Loading student results...</span>
        </div>
      </div>
    );
  }

  if (parentError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-red-700 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-red-900">Failed to load guardian profile</h3>
            <p className="text-sm text-red-700">{parentError}</p>
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

  // Case 0: Zero linked children
  if (childrenList.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="p-10 bg-white rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">No Linked Students</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            There are currently no student accounts linked to your guardian profile. Please contact school administration to view academic results.
          </p>
          <div className="pt-2">
            <Link
              to="/account"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors"
            >
              My Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const childName = selectedChild?.fullName || 'Student';
  const gradeLevel = selectedChild?.classSection?.gradeLevel || selectedChild?.currentEnrollment?.gradeLevel;
  const sectionName = selectedChild?.classSection?.name || selectedChild?.currentEnrollment?.classSection || 'Enrolled';
  const academicYear = selectedChild?.currentEnrollment?.academicYear || 'Current Year';

  const overallAvg = resultsData?.overallAverage ?? 0;
  const totalRecords = resultsData?.totalRecords ?? 0;
  const topScore = resultsData?.grades?.length
    ? Math.max(...resultsData.grades.map((g) => g.score))
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner / Student Information Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-blue-800 text-white flex items-center justify-center font-bold text-2xl shadow-sm flex-shrink-0">
            {selectedChild?.avatarUrl ? (
              <img src={selectedChild.avatarUrl} alt={childName} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              selectedChild?.firstName?.charAt(0) || 'S'
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-gray-900">{childName}</h1>
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-800 border border-purple-200/60 font-bold text-xs rounded-md">
                {gradeLevel ? `${gradeLevel} • ` : ''}{sectionName}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Admission ID: <span className="font-mono font-semibold text-gray-700">{selectedChild?.admissionNo}</span> • Academic Year: <span className="text-gray-700">{academicYear}</span>
            </p>
          </div>
        </div>

        {/* Child Selector if parent has multiple children */}
        {childrenList.length > 1 && (
          <div className="flex items-center gap-3 self-start md:self-auto bg-gray-50 p-2 rounded-2xl border border-gray-200/70">
            <span className="text-xs font-semibold text-gray-500 pl-2">Switch Student:</span>
            <ChildSelector />
          </div>
        )}
      </div>

      {/* API Error State */}
      {resultsError && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-red-900">Unable to load academic results</h4>
            <p className="text-xs text-red-700">{(fetchError as any)?.message || 'Network error occurred.'}</p>
            <button
              onClick={() => void refetchResults()}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        </div>
      )}

      {/* Results Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Average Hero Card */}
        <div className="p-6 bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Overall Average</span>
            <div className="p-2 bg-white/10 rounded-xl">
              <GraduationCap className="w-5 h-5 text-blue-200" />
            </div>
          </div>
          <div className="my-3">
            <h3 className="text-3xl font-black">
              {resultsLoading ? '…' : totalRecords > 0 ? `${overallAvg}%` : '—'}
            </h3>
            <p className="text-xs text-blue-200 mt-1">
              Based on {totalRecords} recorded grade{totalRecords === 1 ? '' : 's'}
            </p>
          </div>
          <div className="pt-2 border-t border-white/10 flex items-center gap-1.5 text-xs text-blue-100 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-blue-300" />
            <span>Cumulative GPA Average</span>
          </div>
        </div>

        {/* Graded Subjects / Records Count */}
        <StatCard
          title="Graded Records"
          value={resultsLoading ? '…' : totalRecords}
          icon={BookOpen}
          iconClassName="bg-blue-50 text-blue-600"
        />

        {/* Top Score */}
        <StatCard
          title="Top Component Score"
          value={resultsLoading ? '…' : totalRecords > 0 ? `${topScore}%` : '—'}
          icon={Award}
          iconClassName="bg-amber-50 text-amber-600"
        />

        {/* Exam Attempts */}
        <StatCard
          title="Exam Attempts"
          value={resultsLoading ? '…' : examAttempts.length}
          icon={FileText}
          iconClassName="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Subject & Component Scores Table Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Header & Quarter Filter */}
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Recorded Academic Grades
            </h3>
            <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2.5 py-1 rounded-full">
              {resultsLoading ? '…' : `${filteredGrades.length} Records`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quarter Filter */}
            <div className="flex bg-gray-100/80 p-1 rounded-xl text-xs font-semibold text-gray-600">
              {['ALL', '1', '2', '3', '4'].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuarterFilter(q)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    quarterFilter === q
                      ? 'bg-white text-gray-900 shadow-xs font-bold'
                      : 'hover:text-gray-900'
                  }`}
                >
                  {q === 'ALL' ? 'All Quarters' : `Q${q}`}
                </button>
              ))}
            </div>

            {/* Sort Toggle */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-semibold text-gray-700 shadow-xs transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
              {sortOrder === 'desc' ? 'Highest Score' : 'Lowest Score'}
            </button>
          </div>
        </div>

        {/* Grades Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Quarter</th>
                <th className="px-6 py-4 text-center">Score Breakdown (Mid / Asgn / Quiz / CW / Final)</th>
                <th className="px-6 py-4 text-center">Total Score</th>
                <th className="px-6 py-4 text-center">Grade Letter</th>
                <th className="px-6 py-4 text-right">Date Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resultsLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading academic results for {childName}...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!resultsLoading && !resultsError && filteredGrades.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                      <GraduationCap className="w-8 h-8 text-gray-300" />
                      <span className="font-bold text-gray-700">No grades recorded yet</span>
                      <p className="text-xs text-gray-400">
                        {quarterFilter !== 'ALL'
                          ? `No recorded grades found for Quarter ${quarterFilter}.`
                          : `No academic grades have been published for ${childName} yet.`}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!resultsLoading &&
                filteredGrades.map((grade) => {
                  const letter = grade.gradeLetter;
                  return (
                    <tr key={grade.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                        {grade.subject}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg">
                          {grade.quarter ? `Quarter ${grade.quarter}` : 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 font-mono">
                          <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100" title="Mid-Term Exam">
                            Mid: <strong>{grade.mid ?? '—'}</strong>
                          </span>
                          <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100" title="Assignment">
                            Asgn: <strong>{grade.assignment ?? '—'}</strong>
                          </span>
                          <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100" title="Quiz">
                            Quiz: <strong>{grade.quiz ?? '—'}</strong>
                          </span>
                          <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100" title="Classwork">
                            CW: <strong>{grade.classwork ?? '—'}</strong>
                          </span>
                          <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100" title="Final Exam">
                            Final: <strong>{grade.final ?? '—'}</strong>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-blue-950 text-base">
                        {grade.score}%
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-0.5 rounded-full text-xs font-black border ${
                            letter === 'A'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : letter === 'B'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : letter === 'C'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : letter === 'D'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {letter}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-gray-500">
                        {grade.createdAt ? new Date(grade.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Examination Attempts Log */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Online Examination Attempts & Submissions
          </h3>
          <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2.5 py-1 rounded-full">
            {resultsLoading ? '…' : `${examAttempts.length} Attempts`}
          </span>
        </div>

        {resultsLoading && (
          <div className="p-8 text-center text-sm text-gray-500">Loading exam attempts...</div>
        )}

        {!resultsLoading && examAttempts.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">
            No examination attempt logs found for {childName}.
          </div>
        )}

        {!resultsLoading && examAttempts.length > 0 && (
          <div className="divide-y divide-gray-100">
            {examAttempts.map((attempt) => (
              <div key={attempt.id} className="p-6 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-sm">{attempt.examTitle}</h4>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-semibold rounded-md">
                      {attempt.subject}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Attempted on: {new Date(attempt.createdAt).toLocaleDateString()} {new Date(attempt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {attempt.remarks && (
                    <p className="text-xs text-gray-600 italic mt-1">Teacher Remarks: "{attempt.remarks}"</p>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block font-bold uppercase">Marks</span>
                    <span className="text-lg font-black text-gray-900">{attempt.marksObtained} pts</span>
                  </div>
                  {attempt.grade && (
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-black rounded-xl">
                      Grade: {attempt.grade}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentResults;
