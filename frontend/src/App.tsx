import { useEffect, useState } from 'react';
import Attendance from './pages/Attendance';
import StudentAssignments from './pages/StudentAssignments';
import RegisteredSubjects from './pages/RegisteredSubjects';
import StudentDashboard from './pages/StudentDashboard';
import Grades from './pages/Grades';
import OnlineExaminations from './pages/OnlineExaminations';
import TakeExam from './pages/TakeExam';
import ClassSchedule from './pages/ClassSchedule';
import StudentLayout from './components/StudentLayout';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState(null, '', path);
      setCurrentPath(path);
    }
  };

  const normalizedPath = currentPath.endsWith('/') && currentPath !== '/' ? currentPath.slice(0, -1) : currentPath;
  let page = <StudentDashboard />;

  if (normalizedPath === '/student/registered-subjects' || normalizedPath === '/student/materials') {
    page = <RegisteredSubjects />;
  } else if (normalizedPath === '/student/attendance') {
    page = <Attendance />;
  } else if (normalizedPath === '/student/assignments') {
    page = <StudentAssignments />;
  } else if (normalizedPath === '/student/grades') {
    page = <Grades />;
  } else if (normalizedPath === '/student/examinations') {
    page = <OnlineExaminations />;
  } else if (normalizedPath === '/student/take-exam') {
    page = <TakeExam />;
  } else if (normalizedPath === '/student/class-schedule') {
    page = <ClassSchedule />;
  }

  return (
    <StudentLayout currentPath={normalizedPath} onNavigate={navigate}>
      {page}
    </StudentLayout>
  );
}
