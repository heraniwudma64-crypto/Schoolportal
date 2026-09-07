import React from 'react';
import { useAuth } from '../../context/AuthContext';
import MyAccount from '../../pages/student/MyAccount';
import TeacherProfile from '../../pages/teacher/Profile';
import ParentAccount from '../../pages/parent/ParentAccount';

export const AccountWrapper: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'teacher') {
    return <TeacherProfile />;
  }

  if (user?.role === 'parent') {
    return <ParentAccount />;
  }

  return <MyAccount />;
};

export default AccountWrapper;
