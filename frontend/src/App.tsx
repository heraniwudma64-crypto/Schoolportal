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