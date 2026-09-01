import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ParentProvider } from './context/ParentContext';
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
import AssignmentDetails from './pages/student/AssignmentDetails';
import MyAccount from './pages/student/MyAccount';

// Admin Specific
import UserManagement from './pages/admin/UserManagement';
import ExamReviewApproval from './pages/admin/ExamReviewApproval';
import AcademicStructure from './pages/admin/AcademicStructure';
import ClassRoster from './pages/admin/ClassRoster';
import AnnouncementCenter from './pages/admin/AnnouncementCenter';
import AuditLogs from './pages/admin/AuditLogs';
import AdminReportCards from './pages/admin/AdminReportCards';
import AdminMyAccount from './pages/admin/AdminMyAccount';
import TeacherAssignments from './pages/admin/TeacherAssignments';

// Teacher Specific
import Performance from './pages/teacher/Performance';
import TeacherProfile from './pages/teacher/Profile';
import HomeroomReportCards from './pages/teacher/HomeroomReportCards';
import HomeroomSubmissionMatrix from './pages/teacher/HomeroomSubmissionMatrix';
import HomeroomRosterRedesigned from './pages/teacher/HomeroomRosterRedesigned';
import ReportCardPrintable from './pages/teacher/ReportCardPrintable';

import MyChildren from './pages/parent/MyChildren';
import ParentAttendance from './pages/parent/ParentAttendance';
import ParentResults from './pages/parent/ParentResults';
import ParentReportCard from './pages/parent/ParentReportCard';
import ParentClassSchedule from './pages/parent/ParentClassSchedule';
import ParentAssignments from './pages/parent/ParentAssignments';

function App() {
  return (
    <AuthProvider>
      <ParentProvider>
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
            <Route path="assignments/:assignmentId" element={<RequireRole allowedRoles={['student']}><AssignmentDetails /></RequireRole>} />
            <Route path="exams" element={<ExamsWrapper />} />
            <Route path="materials" element={<MaterialsWrapper />} />

            {/* Student Only */}
            <Route path="courses" element={<RequireRole allowedRoles={['student']}><MyCourses /></RequireRole>} />
            <Route path="schedule" element={<RequireRole allowedRoles={['student', 'teacher']}><ClassSchedule /></RequireRole>} />
            <Route path="report-card" element={<RequireRole allowedRoles={['student']}><ReportCard /></RequireRole>} />
            <Route path="account" element={<RequireRole allowedRoles={['student']}><MyAccount /></RequireRole>} />

            {/* Teacher Only */}
            <Route path="performance" element={<RequireRole allowedRoles={['teacher']}><Performance /></RequireRole>} />
            <Route path="homeroom/submissions" element={<RequireRole allowedRoles={['teacher']}><HomeroomSubmissionMatrix /></RequireRole>} />
            <Route path="homeroom/roster" element={<RequireRole allowedRoles={['teacher']}><HomeroomRosterRedesigned /></RequireRole>} />
            <Route path="homeroom/report-cards" element={<RequireRole allowedRoles={['teacher']}><ReportCardPrintable /></RequireRole>} />
            {/* Retained for existing saved links. */}
            <Route path="homeroom/reports" element={<RequireRole allowedRoles={['teacher']}><HomeroomReportCards /></RequireRole>} />
            <Route path="/teacher/profile" element={<TeacherProfile />} />
            {/* Admin Only */}
            <Route path="users" element={<RequireRole allowedRoles={['admin']}><UserManagement /></RequireRole>} />
            <Route path="structure" element={<RequireRole allowedRoles={['admin']}><AcademicStructure /></RequireRole>} />
            <Route path="teacher-assignments" element={<RequireRole allowedRoles={['admin']}><TeacherAssignments /></RequireRole>} />
            <Route path="roster" element={<RequireRole allowedRoles={['admin']}><ClassRoster /></RequireRole>} />
            <Route path="exam-review" element={<RequireRole allowedRoles={['admin']}><ExamReviewApproval /></RequireRole>} />
            <Route path="report-cards" element={<RequireRole allowedRoles={['admin']}><AdminReportCards /></RequireRole>} />
            <Route path="announcements" element={<RequireRole allowedRoles={['admin']}><AnnouncementCenter /></RequireRole>} />
            <Route path="logs" element={<RequireRole allowedRoles={['admin']}><AuditLogs /></RequireRole>} />
            <Route path="admin/account" element={<RequireRole allowedRoles={['admin']}><AdminMyAccount /></RequireRole>} />

            {/* Parent Routes */}
            <Route
              path="parent/children"
              element={
                <RequireRole allowedRoles={['parent']}>
                  <MyChildren />
                </RequireRole>
              }
            />
            <Route
              path="parent/attendance"
              element={
                <RequireRole allowedRoles={['parent']}>
                  <ParentAttendance />
                </RequireRole>
              }
            />
            <Route
              path="parent/results"
              element={
                <RequireRole allowedRoles={['parent']}>
                  <ParentResults />
                </RequireRole>
              }
            />
            <Route
              path="parent/report-card"
              element={
                <RequireRole allowedRoles={['parent']}>
                  <ParentReportCard />
                </RequireRole>
              }
            />
            <Route
              path="parent/schedule"
              element={
                <RequireRole allowedRoles={['parent']}>
                  <ParentClassSchedule />
                </RequireRole>
              }
            />
            <Route
              path="parent/assignments"
              element={
                <RequireRole allowedRoles={['parent']}>
                  <ParentAssignments />
                </RequireRole>
              }
            />

            {/* General Account Route */}
            <Route path="account" element={<AdminMyAccount />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      </ParentProvider>
    </AuthProvider>
  );
}

export default App;
