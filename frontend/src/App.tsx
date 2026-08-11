<<<<<<< HEAD
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard'; 
import AdminDashboard from './pages/AdminDashboard';
import ParentDashboard from './pages/ParentDashboard';
import Attendance from './pages/Attendance';
// Import the Teacher Layout and Pages
import TeacherLayout from './components/TeacherLayout';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherSettings from './pages/TeacherSettings'; // <-- Make sure to import this!
import Assignments from './pages/Assignments';
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/parent" element={<ParentDashboard />} />

        {/* Teacher Routes with Persistent Sidebar Layout */}
       <Route path="/teacher" element={<TeacherLayout />}>
  <Route index element={<TeacherDashboard />} />
  <Route path="schedule" element={<div>My Schedule Page Content</div>} />
  <Route path="attendance" element={<Attendance />} />
  <Route path="assignments" element={<Assignments />} />
  <Route path="grades" element={<div>Grade Entry Portal Content</div>} />
  <Route path="exams" element={<div>Exam Creation Content</div>} />
  <Route path="materials" element={<div>Materials Repository Content</div>} />
  <Route path="performance" element={<div>Performance Tracker Content</div>} />
  <Route path="settings" element={<TeacherSettings />} />
</Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
=======
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
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b
