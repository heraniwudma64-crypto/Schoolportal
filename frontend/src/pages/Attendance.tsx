import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Attendance.css';

export default function Attendance() {
  const [classSections, setClassSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  
  const [viewMode, setViewMode] = useState<'mark' | 'history'>('mark');
  const [pastRecords, setPastRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchClassSections();
    fetchDefaultCourse();
  }, []);

  useEffect(() => {
    if (selectedSectionId) {
      fetchStudents(selectedSectionId);
    } else {
      setStudents([]);
    }
  }, [selectedSectionId]);

  const fetchClassSections = async () => {
    try {
      const { data, error } = await supabase.from('ClassSection').select('*');
      if (error) throw error;
      setClassSections(data || []);
    } catch (err) {
      console.error('Error fetching class sections:', err);
    }
  };

  const fetchDefaultCourse = async () => {
    try {
      const { data, error } = await supabase.from('Course').select('*').limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        setSelectedCourseId(data[0].id);
      } else {
        setSelectedCourseId('1');
      }
    } catch (err) {
      console.error('Error fetching default course:', err);
      setSelectedCourseId('1');
    }
  };

  const fetchStudents = async (sectionId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Student')
        .select('*')
        .eq('classSectionId', sectionId);

      if (error) throw error;

      setStudents(data || []);
      const initialStatus: { [key: string]: string } = {};
      (data || []).forEach((student: any) => {
        initialStatus[student.id] = 'present';
      });
      setAttendanceStatus(initialStatus);
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceStatus((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const attendanceRecords = Object.keys(attendanceStatus).map((studentId) => ({
        id: crypto.randomUUID(), 
        userId: studentId,
        courseId: selectedCourseId || '1',
        status: attendanceStatus[studentId],
        date: new Date().toISOString(),
      }));

      const { error } = await supabase.from('Attendance').insert(attendanceRecords);
      if (error) throw error;
      
      alert('Attendance saved successfully!');
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      alert('Failed to save attendance: ' + (err.message || JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  };

  const fetchPastRecords = async () => {
    setViewMode('history');
    try {
      const { data, error } = await supabase
        .from('Attendance')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setPastRecords(data || []);
    } catch (err) {
      console.error('Error fetching past attendance records:', err);
    }
  };

  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase();
    const name = (student.full_name || '').toLowerCase();
    const admission = (student.admissionNo || student.id || '').toLowerCase();
    return name.includes(query) || admission.includes(query);
  });

  return (
    <div className="attendance-container">
      <div className="attendance-wrapper">
        {/* Header Title & Actions */}
        <div className="attendance-header">
          <div>
            <h1 className="attendance-title">Attendance Management</h1>
            <p className="attendance-subtitle">Mark student attendance for the selected session.</p>
          </div>
          <div className="header-actions">
            {viewMode === 'mark' ? (
              <button onClick={fetchPastRecords} className="btn-secondary">
                <svg style={{ width: '14px', height: '14px' }} className="flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Past Records
              </button>
            ) : (
              <button onClick={() => setViewMode('mark')} className="btn-secondary">
                Back to Marking
              </button>
            )}

            {viewMode === 'mark' && (
              <button
                onClick={handleSaveAttendance}
                disabled={saving || students.length === 0}
                className="btn-primary"
              >
                <svg style={{ width: '14px', height: '14px' }} className="flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {viewMode === 'mark' ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
              {/* Class / Section Dropdown */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Class / Section</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <select 
                    value={selectedSectionId} 
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '0.5rem 2.5rem 0.5rem 0.75rem', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '0.5rem', 
                      backgroundColor: '#ffffff', 
                      color: '#111827', 
                      fontSize: '0.875rem', 
                      outline: 'none', 
                      appearance: 'none', 
                      WebkitAppearance: 'none', 
                      MozAppearance: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="" disabled style={{ color: '#9CA3AF' }}>Choose section</option>
                    {classSections.map((sec) => (
                      <option key={sec.id} value={sec.id} style={{ color: '#111827' }}>
                        {sec.name || sec.title || 'Grade 10A'}
                      </option>
                    ))}
                  </select>
                  {/* Custom Arrow Icon */}
                  <svg style={{ position: 'absolute', right: '12px', width: '14px', height: '14px', color: '#9CA3AF', pointerEvents: 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Search Student Input */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Search Student</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <svg style={{ position: 'absolute', left: '10px', width: '14px', height: '14px', color: '#9CA3AF', pointerEvents: 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter name or ID..." 
                    style={{ width: '100%', paddingLeft: '2.25rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem', backgroundColor: '#ffffff', color: '#111827', fontSize: '0.875rem', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Students List Table */}
            <div className="table-card">
              <div className="table-header-grid">
                <div className="col-name-header">Student Name</div>
                <div className="col-id-header">ID Number</div>
                <div className="col-status-header">Mark Status</div>
              </div>

              {loading ? (
                <div className="table-message">Loading students...</div>
              ) : filteredStudents.length > 0 ? (
                <div className="table-body-divider">
                  {filteredStudents.map((student) => {
                    const currentStatus = attendanceStatus[student.id] || 'present';
                    return (
                      <div key={student.id} className="table-row-grid">
                        <div className="col-name" style={{ fontWeight: 600, color: '#111827' }}>
                          {student.full_name}
                        </div>
                        <div className="col-id">
                          {student.admissionNo || student.id}
                        </div>
                        <div className="col-status">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'present')}
                            className={`status-btn present ${currentStatus === 'present' ? 'active' : ''}`}
                          >
                            <svg style={{ width: '12px', height: '12px' }} className="flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            PRESENT
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'absent')}
                            className={`status-btn absent ${currentStatus === 'absent' ? 'active' : ''}`}
                          >
                            <svg style={{ width: '12px', height: '12px' }} className="flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            ABSENT
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'late')}
                            className={`status-btn late ${currentStatus === 'late' ? 'active' : ''}`}
                          >
                            <svg style={{ width: '12px', height: '12px' }} className="flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            LATE
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="table-message">
                  {selectedSectionId ? 'No students found in this class section.' : 'Please select a class section above to view students.'}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Past Records View */
          <div className="table-card">
            <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #F3F4F6', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 700, color: '#1F2937', fontSize: '0.75rem', margin: 0 }}>Saved Attendance History</h3>
              <span style={{ fontSize: '0.6875rem', color: '#9CA3AF', fontWeight: 700 }}>{pastRecords.length} records found</span>
            </div>
            {pastRecords.length > 0 ? (
              <div className="table-body-divider">
                {pastRecords.map((record, index) => (
                  <div key={index} style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#1F2937', fontSize: '0.875rem', margin: 0 }}>Student ID: {record.userId}</p>
                      <p style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginTop: '0.125rem', marginBottom: 0 }}>Date: {new Date(record.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span style={{ padding: '0.375rem 0.875rem', borderRadius: '9999px', fontSize: '0.625rem', fontWeight: 900, backgroundColor: record.status === 'present' ? '#ECFDF5' : record.status === 'absent' ? '#FEF2F2' : '#FFFBEB', color: record.status === 'present' ? '#047857' : record.status === 'absent' ? '#DC2626' : '#D97706' }}>
                        {record.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="table-message">No past attendance records found in the database.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}