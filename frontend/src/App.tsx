import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardOverviewWrapper from './components/dashboard/DashboardOverviewWrapper';
import RequireRole from './components/auth/RequireRole';

// Wrappers
import ResultsWrapper from './components/wrappers/ResultsWrapper';
import AttendanceWrapper from './components/wrappers/AttendanceWrapper';
import AssignmentsWrapper from './components/wrappers/AssignmentsWrapper';
import ExamsWrapper from './components/wrappers/ExamsWrapper';
import MaterialsWrapper from './components/wrappers/MaterialsWrapper';

// Student Specific
import MyCourses from './pages/student/MyCourses';
import ClassSchedule from './pages/student/ClassSchedule';
import ReportCard from './pages/student/ReportCard';

// Admin Specific
import UserManagement from './pages/admin/UserManagement';
import ExamReviewApproval from './pages/admin/ExamReviewApproval';
import AcademicStructure from './pages/admin/AcademicStructure';
import ClassRoster from './pages/admin/ClassRoster';
import AnnouncementCenter from './pages/admin/AnnouncementCenter';
import AuditLogs from './pages/admin/AuditLogs';

// Teacher Specific
import Performance from './pages/teacher/Performance';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Dashboard Routes */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardOverviewWrapper />} />

            {/* Shared Routes with Wrappers */}
            <Route path="results" element={<ResultsWrapper />} />
            <Route path="attendance" element={<AttendanceWrapper />} />
            <Route path="assignments" element={<AssignmentsWrapper />} />
            <Route path="exams" element={<ExamsWrapper />} />
            <Route path="materials" element={<MaterialsWrapper />} />

            {/* Student Only */}
            <Route path="courses" element={<RequireRole allowedRoles={['student']}><MyCourses /></RequireRole>} />
            <Route path="schedule" element={<RequireRole allowedRoles={['student', 'teacher']}><ClassSchedule /></RequireRole>} />
            <Route path="report-card" element={<RequireRole allowedRoles={['student']}><ReportCard /></RequireRole>} />

            {/* Teacher Only */}
            <Route path="performance" element={<RequireRole allowedRoles={['teacher']}><Performance /></RequireRole>} />

            {/* Admin Only */}
            <Route path="users" element={<RequireRole allowedRoles={['admin']}><UserManagement /></RequireRole>} />
            <Route path="roster" element={<RequireRole allowedRoles={['admin']}><ClassRoster /></RequireRole>} />
            <Route path="exam-review" element={<RequireRole allowedRoles={['admin']}><ExamReviewApproval /></RequireRole>} />
            <Route path="structure" element={<RequireRole allowedRoles={['admin']}><AcademicStructure /></RequireRole>} />
            <Route path="announcements" element={<RequireRole allowedRoles={['admin']}><AnnouncementCenter /></RequireRole>} />
            <Route path="logs" element={<RequireRole allowedRoles={['admin']}><AuditLogs /></RequireRole>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
