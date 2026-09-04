import React, { useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  BookOpen, 
  Calendar,
  Layers,
  GraduationCap,
  Shield,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from './StatCard';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useGradeLevels } from '../../hooks/useAcademicStructure';
import { useUsers } from '../../hooks/useUsers';

const AdminOverview: React.FC = () => {
  const { activeAcademicYear, activeAcademicYearId, isLoading: isLoadingYear } = useAcademicYear();
  const { data: gradeLevels = [], isLoading: isLoadingGrades } = useGradeLevels(activeAcademicYearId);
  const { stats, isStatsLoading, fetchStats } = useUsers();

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const activeGradeLevels = gradeLevels.filter((g) => g.ClassSection && g.ClassSection.length > 0);
  const totalSections = activeGradeLevels.reduce((acc, g) => acc + (g.ClassSection?.length || 0), 0);
  const totalEnrollments = activeGradeLevels.reduce((acc, g) => acc + (g.StudentEnrollment?.length || g._count?.StudentEnrollment || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={isStatsLoading ? '...' : (stats?.students ?? 0)} 
          icon={GraduationCap} 
          iconClassName="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Total Teachers" 
          value={isStatsLoading ? '...' : (stats?.teachers ?? 0)} 
          icon={UserCheck} 
          iconClassName="bg-indigo-50 text-indigo-600"
        />
        <StatCard 
          title="Active Class Sections" 
          value={isLoadingGrades ? '...' : totalSections} 
          icon={BookOpen} 
          iconClassName="bg-amber-50 text-amber-600"
        />
        <StatCard 
          title="Active Academic Year" 
          value={isLoadingYear ? '...' : (activeAcademicYear?.year || 'Not Set')} 
          icon={Calendar} 
          iconClassName="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Academic Structure & Year Scope */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-black text-gray-900">Academic Structure Breakdown</h3>
                <p className="text-sm text-gray-500">
                  Active academic year: <span className="font-semibold text-blue-900">{activeAcademicYear?.year || 'None'}</span> ({totalEnrollments} active enrollments)
                </p>
              </div>
              <Link
                to="/admin/academic-structure"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
              >
                Manage Structure
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoadingGrades ? (
              <div className="py-12 text-center text-gray-400 text-sm">Loading structure data...</div>
            ) : activeGradeLevels.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No active grade levels found for the active academic year.</div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {activeGradeLevels.map((grade) => {
                    const sectionCount = grade.ClassSection?.length || 0;
                    const enrollmentCount = grade.StudentEnrollment?.length || grade._count?.StudentEnrollment || 0;
                    return (
                      <div key={grade.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-gray-900">{grade.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {grade.gradeNumber != null ? `Grade ${grade.gradeNumber}` : 'Level'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center justify-between">
                          <span>{sectionCount} {sectionCount === 1 ? 'Section' : 'Sections'}</span>
                          <span className="font-medium text-gray-700">{enrollmentCount} Enrolled</span>
                        </div>
                        {sectionCount > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {grade.ClassSection?.map((sec) => (
                              <span key={sec.id} className="text-[10px] bg-white border border-gray-200 rounded-md px-1.5 py-0.5 font-medium text-gray-600">
                                {sec.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Distribution Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Total
                </span>
              </div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Users</h4>
              <p className="text-2xl font-black text-gray-900 mt-1">{stats?.total ?? 0}</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Active
                </span>
              </div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Accounts</h4>
              <p className="text-2xl font-black text-gray-900 mt-1">{stats?.active ?? 0}</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Parents
                </span>
              </div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Parents Registered</h4>
              <p className="text-2xl font-black text-gray-900 mt-1">{stats?.parents ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Admin Actions / Navigation */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden p-6">
            <h3 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-900" />
              Quick Navigation
            </h3>
            <div className="space-y-2">
              {[
                { title: 'Academic Structure', desc: 'Manage years, grade levels & sections', path: '/admin/academic-structure' },
                { title: 'Teacher Assignments', desc: 'Assign subjects and homerooms', path: '/admin/teacher-assignments' },
                { title: 'Timetable Management', desc: 'Configure periods & weekly schedules', path: '/admin/timetable' },
                { title: 'Class Roster', desc: 'View student rosters and enrollments', path: '/admin/class-roster' },
                { title: 'Report Cards Review', desc: 'Inspect term and yearly report cards', path: '/admin/report-cards' },
                { title: 'User Management', desc: 'Create and manage student & staff accounts', path: '/admin/users' },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  to={item.path}
                  className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group"
                >
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-900 transition-colors">{item.title}</h4>
                    <p className="text-[11px] text-gray-400">{item.desc}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-900 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
