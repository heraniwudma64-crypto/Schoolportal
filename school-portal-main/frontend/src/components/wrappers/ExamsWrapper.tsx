import React from 'react';
import { useAuth } from '../../context/AuthContext';
import StudentExams from '../../pages/student/OnlineExams';
import TeacherExams from '../../pages/teacher/ExamCreation';

const ExamsWrapper = () => {
  const { user } = useAuth();
  return user?.role === 'teacher' ? <TeacherExams /> : <StudentExams />;
};

export default ExamsWrapper;
