import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ClassSchedule from '../../pages/student/ClassSchedule';
import TeacherSchedule from '../../pages/teacher/TeacherSchedule';

const ScheduleWrapper: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'teacher') {
    return <TeacherSchedule />;
  }

  return <ClassSchedule />;
};

export default ScheduleWrapper;
