import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StudentAssignments from '../../pages/student/Assignments';
import TeacherAssignments from '../../pages/teacher/AssignmentPublishing';

const AssignmentsWrapper = () => {
  const { user } = useAuth();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();

  return user?.role === 'teacher' ? <TeacherAssignments /> : <StudentAssignments searchQuery={searchQuery} />;
};

export default AssignmentsWrapper;
