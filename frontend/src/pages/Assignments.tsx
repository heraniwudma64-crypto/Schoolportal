import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function TeacherAssignments() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [courseId, setCourseId] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
const coursesRes = await api.get('/courses');
        setCourses(coursesRes.data);
        if (coursesRes.data.length > 0) {
          setCourseId(coursesRes.data[0].id);
}
      } catch (err) {
        console.error('Failed to load teacher dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/assignments', {
        title,
        description,
        dueDate,
courseId: Number(courseId),
});
      alert('Assignment created successfully!');
      setTitle('');
      setDescription('');
      setDueDate('');
    } catch (err) {
      alert('Failed to create assignment. Check your inputs.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading teacher portal...</div>;

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Teacher / Admin Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      <hr style={{ margin: '20px 0' }} />

<section style={{ marginBottom: '40px', background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        <h3>Create New Assignment</h3>
        <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
          <input
            type="text"
            placeholder="Assignment Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
/>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
<button type="submit" style={{ padding: '10px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
Publish Assignment
          </button>
        </form>
      </section>

<section>
        <h3>Managed Courses</h3>
        {courses.length === 0 ? <p>No courses assigned.</p> : (
          <ul>
            {courses.map((course) => (
              <li key={course.id}><strong>{course.title}</strong> — {course.description}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
