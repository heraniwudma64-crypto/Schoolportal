import React from 'react';
import { useAuth } from '../../context/AuthContext';
import StudentOverview from './StudentOverview';
import TeacherOverview from './TeacherOverview';
import AdminOverview from './AdminOverview';

const DashboardOverviewWrapper = () => {
  const { user } = useAuth();

  if (user?.role === 'student') {
    return <StudentOverview />;
  }

  if (user?.role === 'teacher') {
    return <TeacherOverview />;
  }

  if (user?.role === 'admin') {
    return <AdminOverview />;
  }

  return (
    <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold">Welcome, {user?.name}!</h2>
      <p className="text-gray-500 mt-2">Please select an option from the sidebar to continue.</p>
    </div>
  );
};

export default DashboardOverviewWrapper;
