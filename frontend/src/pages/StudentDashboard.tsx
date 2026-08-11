import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function StudentDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const [coursesRes, assignmentsRes, attendanceRes] = await Promise.all([
          api.get('/courses'),
          api.get('/assignments'),
          api.get('/attendance/my')
        ]);

        setCourses(coursesRes.data);
        setAssignments(assignmentsRes.data);
        setAttendance(attendanceRes.data);
      } catch (err) {
        console.error('Failed to load student dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading student portal...</div>;

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Student Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      <hr style={{ margin: '20px 0' }} />

      {/* Courses Section */}
      <section style={{ marginBottom: '30px' }}>
        <h3>My Courses</h3>
        {courses.length === 0 ? <p>No courses enrolled yet.</p> : (
          <ul>
            {courses.map((course) => (
              <li key={course.id}><strong>{course.title}</strong> - {course.description}</li>
            ))}
          </ul>
        )}
      </section>

      {/* Assignments Section */}
      <section style={{ marginBottom: '30px' }}>
        <h3>Assignments</h3>
        {assignments.length === 0 ? <p>No active assignments.</p> : (
          <ul>
            {assignments.map((assignment) => (
              <li key={assignment.id}>
                <strong>{assignment.title}</strong> (Due: {new Date(assignment.dueDate).toLocaleDateString()})
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Attendance Section */}
      <section>
        <h3>Attendance Record</h3>
        {attendance.length === 0 ? <p>No attendance records found.</p> : (
          <ul>
            {attendance.map((att, index) => (
              <li key={index}>
                Date: {new Date(att.date).toLocaleDateString()} — Status: <strong>{att.status}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}