import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Adjust path if your supabaseClient.ts is in a different folder

interface Student {
  id: number | string;
  name: string;
  class_name: string;
  status?: 'PRESENT' | 'ABSENT' | 'LATE';
}

export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState<string>('Grade 10A');
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Dropdown options
  const classesList = ['Grade 10A', 'Grade 10B', 'Grade 11A'];
  const subjectsList = ['Mathematics', 'Physics', 'Chemistry', 'English'];

 // Fetch students from Supabase whenever 'selectedClass' changes
 useEffect(() => {
    const fetchStudentsForClass = async () => {
      setLoading(true);
      setMessage('');
      
      // Fetch from the 'student' table and join the 'user' table data
      const { data, error } = await supabase
        .from('student')
        .select(`
          id,
          class_name,
          user:user_id ( name, email )
        `)
        .eq('class_name', selectedClass);

      if (error) {
        console.error('Error fetching students:', error.message);
        setMessage(`Error loading students: ${error.message}`);
        setStudents([]);
      } else {
        // Flatten the joined data structure for your UI table
        const formattedStudents = (data || []).map((item: any) => ({
          id: item.id,
          name: item.user?.name || 'Unknown', // Pulled safely from the linked User table
          class_name: item.class_name,
          status: 'PRESENT',
        }));
        setStudents(formattedStudents);
      }
      setLoading(false);
    };

    fetchStudentsForClass();
  }, [selectedClass]);

  // Handle individual status toggle
  const handleStatusChange = (studentId: number | string, newStatus: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setStudents(prev =>
      prev.map(s => (s.id === studentId ? { ...s, status: newStatus } : s))
    );
  };

  // Save attendance session data to Supabase
  const handleSaveChanges = async () => {
    if (students.length === 0) {
      alert('No students found to save attendance for.');
      return;
    }

    const presentCount = students.filter(s => s.status === 'PRESENT').length;
    const absentCount = students.filter(s => s.status === 'ABSENT').length;

    const payload = {
      date: new Date().toISOString(),
      class_name: selectedClass,
      subject: selectedSubject,
      present_count: presentCount,
      absent_count: absentCount,
      records: students, // Saves full student roster and individual statuses as JSON
    };

    try {
      const { error } = await supabase
        .from('attendance')
        .insert([payload]);

      if (error) {
        console.error('Supabase error:', error.message);
        alert(`Error saving to database: ${error.message}`);
      } else {
        alert(`Attendance successfully saved for ${selectedClass}!`);
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      alert('Failed to connect to Supabase database.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>Take Class Attendance</h2>

      {/* Class and Subject Selectors */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Select Class:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{ padding: '8px', fontSize: '16px' }}
          >
            {classesList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Select Subject:</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{ padding: '8px', fontSize: '16px' }}
          >
            {subjectsList.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {message && <p style={{ color: 'red' }}>{message}</p>}

      {/* Students Marking Table */}
      {loading ? (
        <p>Loading students...</p>
      ) : students.length === 0 ? (
        <p style={{ color: '#666' }}>
          No students registered in this class yet. Add students to your <b>`students`</b> table in Supabase matching this class name.
        </p>
      ) : (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#f4f4f4', textAlign: 'left' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Student Name</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{student.name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <select
                      value={student.status}
                      onChange={(e) => handleStatusChange(student.id, e.target.value as any)}
                      style={{ padding: '5px' }}
                    >
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                      <option value="LATE">Late</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleSaveChanges}
            style={{
              background: '#0070f3',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              borderRadius: '5px',
            }}
          >
            Save Changes to Supabase
          </button>
        </div>
      )}
    </div>
  );
}