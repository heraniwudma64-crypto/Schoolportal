<<<<<<< HEAD
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
=======
﻿import { useMemo, useState } from 'react';

type AttendanceRecord = {
  date: string;
  subject: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  teacher: string;
};

const months = [
  'All Months',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const attendanceRecords: AttendanceRecord[] = [
  { date: '2024-05-18', subject: 'Mathematics', status: 'PRESENT', teacher: 'Meron Tadesse' },
  { date: '2024-05-17', subject: 'Physics', status: 'PRESENT', teacher: 'Meron Tadesse' },
  { date: '2024-05-16', subject: 'English', status: 'LATE', teacher: 'Dawit Gebre' },
  { date: '2024-05-15', subject: 'Mathematics', status: 'PRESENT', teacher: 'Meron Tadesse' },
  { date: '2024-05-14', subject: 'Physics', status: 'ABSENT', teacher: 'Meron Tadesse' },
];

function getMonthName(dateString: string) {
  return new Date(dateString).toLocaleString('en', { month: 'long' });
}

function getBadgeStyle(status: AttendanceRecord['status']) {
  switch (status) {
    case 'PRESENT':
      return 'text-emerald-700 bg-emerald-100';
    case 'ABSENT':
      return 'text-rose-700 bg-rose-100';
    case 'LATE':
      return 'text-amber-800 bg-amber-100';
    default:
      return 'text-slate-700 bg-slate-100';
  }
}

export default function Attendance() {
  const [selectedMonth, setSelectedMonth] = useState('All Months');

  const filteredRecords = useMemo(() => {
    if (selectedMonth === 'All Months') return attendanceRecords;
    return attendanceRecords.filter((record) => getMonthName(record.date) === selectedMonth);
  }, [selectedMonth]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Attendance Records</h1>
          <p className="mt-2 text-sm text-slate-500">Review your attendance summary and recent activity.</p>
        </div>
        <div className="w-full max-w-xs rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto">
          <div className="flex items-center gap-3">
            <span>All Months</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
            >
              {months.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 text-xl">✓</div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Present</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">172 Days</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 text-xl">✕</div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Absent</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">5 Days</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 text-xl">⏰</div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Late</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">3 Days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Recent Attendance Details</h2>
            <p className="mt-1 text-sm text-slate-500">Details for the selected month.</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-left">
            <thead>
              <tr>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Date</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Subject</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Teacher</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={`${record.date}-${record.subject}`} className="rounded-3xl bg-white shadow-sm">
                    <td className="whitespace-nowrap px-4 py-5 align-top">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">📅</span>
                        <span>{record.date}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 align-top">
                      <p className="font-medium text-slate-900">{record.subject}</p>
                    </td>
                    <td className="px-4 py-5 align-top">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBadgeStyle(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-5 align-top text-sm text-slate-700">{record.teacher}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                    No attendance records for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b
