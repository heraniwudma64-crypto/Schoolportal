import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardList, 
  Calendar, 
  GraduationCap, 
  FileText, 
  CheckSquare, 
  Book, 
  Users, 
  FileCheck, 
  Bell,
  LogOut,
  ChevronRight,
  UserCircle,
  UserCog,
  Award,
  Settings
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import { APP_NAME, APP_DESCRIPTION } from '../../config/branding';

interface SidebarProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const Sidebar = ({ isOpen, onMouseEnter, onMouseLeave }: SidebarProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Check if the current user is assigned as a Homeroom Teacher
  const [isHomeroomTeacher, setIsHomeroomTeacher] = React.useState(false);

  React.useEffect(() => {
    if (user?.role !== 'teacher') { setIsHomeroomTeacher(false); return; }
    api.get<{ isHomeroomTeacher: boolean }>('/teachers/me/homeroom-context')
      .then((context) => setIsHomeroomTeacher(context.isHomeroomTeacher))
      .catch(() => setIsHomeroomTeacher(false));
  }, [user?.role, user?.id]);

  const getLinks = () => {
    const role = user?.role;
    
    const common = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ];

    if (role === 'student') {
      return [
        ...common,
        { name: 'My Courses', href: '/courses', icon: BookOpen },
        { name: 'Assignments', href: '/assignments', icon: ClipboardList },
        { name: 'Class Schedule', href: '/schedule', icon: Calendar },
        { name: 'My Results', href: '/results', icon: GraduationCap },
        { name: 'Online Exams', href: '/exams', icon: FileText },
        { name: 'Report Card', href: '/report-card', icon: FileCheck },
        { name: 'Attendance', href: '/attendance', icon: CheckSquare },
        { name: 'Materials', href: '/materials', icon: Book },
      ];
    }

    if (role === 'teacher') {
      const teacherLinks = [
        ...common,
        { name: 'My Schedule', href: '/schedule', icon: Calendar },
        { name: 'Attendance', href: '/attendance', icon: CheckSquare },
        { name: 'Assignments', href: '/assignments', icon: ClipboardList },
        { name: 'Grade Entry', href: '/results', icon: GraduationCap },
        { name: 'Exam Creation', href: '/exams', icon: FileText },
        { name: 'Materials', href: '/materials', icon: Book },
        { name: 'Performance', href: '/performance', icon: Users },
      ];

      // Add Homeroom-specific routes if teacher holds homeroom duty
      if (isHomeroomTeacher) {
        teacherLinks.push(
          { name: 'Submission Matrix', href: '/homeroom/submissions', icon: FileCheck },
          { name: 'Class Roster & Ranks', href: '/homeroom/roster', icon: Users },
          { name: 'Homeroom Report Cards', href: '/homeroom/report-cards', icon: Award },
          { name: 'Prepare Report Cards', href: '/homeroom/reports', icon: FileCheck },
        );
      }

      return teacherLinks;
    }

    if (role === 'admin') {
      return [
        ...common,
        { name: 'User Management', href: '/users', icon: Users },
        { name: 'Academic Structure', href: '/structure', icon: UserCog },
        { name: 'Teacher Assignments', href: '/teacher-assignments', icon: BookOpen },
        { name: 'Roster Review', href: '/roster', icon: ClipboardList },
        { name: 'Exam Review', href: '/exam-review', icon: FileCheck },
        { name: 'Report Card Review', href: '/report-cards', icon: FileCheck },
        { name: 'Materials', href: '/materials', icon: Book },
        { name: 'Announcements', href: '/announcements', icon: Bell },
      ];
    }

    if (role === 'parent') {
      return [
        ...common,
        { name: 'My Children', href: '/parent/children', icon: Users },
        { name: 'Attendance', href: '/parent/attendance', icon: CheckSquare },
        { name: 'Results', href: '/parent/results', icon: GraduationCap },
        { name: 'Report Card', href: '/parent/report-card', icon: FileCheck },
        { name: 'Class Schedule', href: '/parent/schedule', icon: Calendar },
        { name: 'Assignments', href: '/parent/assignments', icon: ClipboardList },
        { name: 'Account', href: '/account', icon: Settings },
      ];
    }

    return common;
  };

  const links = getLinks();

  return (
    <div 
      onMouseEnter={onMouseEnter} 
      onMouseLeave={onMouseLeave} 
      className={cn(
        "flex flex-col h-full bg-[#1e3a8a] text-white w-64 fixed left-0 top-0 overflow-y-auto z-50 transition-transform duration-300 ease-in-out", 
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <GraduationCap className="text-[#1e3a8a] w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">{APP_NAME}</h1>
          <p className="text-xs text-blue-200">{APP_DESCRIPTION}</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                isActive 
                  ? "bg-white/10 text-white font-semibold" 
                  : "text-blue-100 hover:bg-white/5 hover:text-white"
              )}
            >
              <link.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-blue-200 group-hover:text-white")} />
              <span className="text-sm font-medium">{link.name}</span>
              {isActive && <ChevronRight className="ml-auto w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-white/20" />
          ) : (
            <UserCircle className="w-8 h-8 text-blue-200" />
          )}
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-blue-300 capitalize">
              {user?.role} {isHomeroomTeacher ? '(Homeroom)' : ''}
            </p>
          </div>
        </div>
        <Link
          to={user?.role === 'admin' ? '/admin/account' : '/teacher/profile'}
          className={cn(
            "flex items-center gap-3 px-3 py-2 w-full text-blue-100 hover:bg-white/5 hover:text-white rounded-lg transition-colors mb-1",
            location.pathname.includes('/account') ? "bg-white/10 text-white" : ""
          )}
        >
          <UserCog className="w-5 h-5" />
          <span className="text-sm font-medium">My Account</span>
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full text-blue-100 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
