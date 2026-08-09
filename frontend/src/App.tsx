import { useEffect, useState } from 'react';
import Attendance from './pages/Attendance';
import RegisteredSubjects from './pages/RegisteredSubjects';
import StudentDashboard from './pages/StudentDashboard';
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

  if (normalizedPath === '/student/registered-subjects') {
    page = <RegisteredSubjects />;
  } else if (normalizedPath === '/student/attendance') {
    page = <Attendance />;
  }

  return (
    <StudentLayout currentPath={normalizedPath} onNavigate={navigate}>
      {page}
    </StudentLayout>
  );
}
