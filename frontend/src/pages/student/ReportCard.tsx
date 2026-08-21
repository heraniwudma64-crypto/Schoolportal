import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Award, Download, GraduationCap, Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../config/branding';
import { getMyAttendance, getMyCourses, getMyResults } from '../../api/students';

const ReportCard = () => {
  const { user } = useAuth();
  const { data: courses = [], isLoading: coursesLoading, isError: coursesError } = useQuery({ queryKey: ['my-courses'], queryFn: getMyCourses });
  const { data: results = [], isLoading: resultsLoading, isError: resultsError } = useQuery({ queryKey: ['my-results'], queryFn: getMyResults });
  const { data: attendance = [], isLoading: attendanceLoading, isError: attendanceError } = useQuery({ queryKey: ['my-attendance'], queryFn: getMyAttendance });

  const totalObtained = results.reduce((sum, result) => sum + result.marksObtained, 0);
  const totalPossible = results.reduce((sum, result) => sum + result.Exam.totalMarks, 0);
  const average = totalPossible ? (totalObtained / totalPossible) * 100 : null;
  const present = attendance.filter((record) => record.status === 'PRESENT').length;
  const absent = attendance.filter((record) => record.status === 'ABSENT').length;
  const late = attendance.filter((record) => record.status === 'LATE').length;
  const attendancePercentage = attendance.length ? (present / attendance.length) * 100 : null;
  const remarks = results.filter((result) => result.remarks);
  const grade = courses[0]?.grade;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between no-print">
        <h2 className="text-2xl font-bold text-gray-900">Academic Report Card</h2>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"><Printer className="w-4 h-4" />Print</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors"><Download className="w-4 h-4" />Download PDF</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 bg-[#1e3a8a] text-white flex flex-col md:flex-row justify-between gap-8">
          <div className="flex gap-6">
            <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm"><GraduationCap className="w-12 h-12 text-white" /></div>
            <div>
              <h1 className="text-3xl font-black mb-1">{APP_NAME}</h1>
              <p className="text-blue-200 text-sm font-bold uppercase tracking-widest">Academic Results Summary</p>
              <div className="mt-4 flex gap-4 text-xs text-blue-100 font-medium">
                <span>ACADEMIC YEAR: Not available</span><span className="w-px h-4 bg-white/20" />
                <span>GRADE: {coursesLoading ? 'Loading...' : grade ?? 'Not available'}</span>
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col justify-end">
            <p className="text-sm font-bold text-blue-200 uppercase mb-1">Student Information</p>
            <h2 className="text-xl font-bold">{user?.name ?? '—'}</h2>
            <p className="text-sm text-blue-100 italic">ID: {user?.idNumber ?? '—'}</p>
          </div>
        </div>

        <div className="p-8">
          {coursesError && <p className="mb-4 text-sm text-red-600">Could not load your enrolled grade information.</p>}
          {attendanceError && <p className="mb-4 text-sm text-red-600">Could not load your attendance summary.</p>}
          <Table className="border border-gray-100">
            <TableHeader><TableRow className="bg-gray-50">
              <TableHead className="font-black text-gray-900 border-r border-gray-100">Subject</TableHead>
              <TableHead className="font-bold border-r border-gray-100">Exam</TableHead>
              <TableHead className="font-bold border-r border-gray-100">Term</TableHead>
              <TableHead className="text-center font-black bg-blue-50 text-blue-900 border-r border-gray-200">Score</TableHead>
              <TableHead className="text-center font-bold border-r border-gray-100">Grade</TableHead>
              <TableHead className="text-right font-black bg-blue-900 text-white">Remarks</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {resultsLoading && <TableRow><TableCell colSpan={6} className="py-8 text-center text-gray-500">Loading report results...</TableCell></TableRow>}
              {resultsError && <TableRow><TableCell colSpan={6} className="py-8 text-center text-red-600">Could not load report results.</TableCell></TableRow>}
              {!resultsLoading && !resultsError && results.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-gray-500">No results are available for this report yet.</TableCell></TableRow>}
              {results.map((result) => {
                const percentage = result.Exam.totalMarks ? (result.marksObtained / result.Exam.totalMarks) * 100 : null;
                return <TableRow key={result.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-semibold text-gray-900 border-r border-gray-100">{result.Exam.Subject.name}</TableCell>
                  <TableCell className="border-r border-gray-100">{result.Exam.title}</TableCell>
                  <TableCell className="border-r border-gray-100">{result.Exam.Term?.name ?? '—'}</TableCell>
                  <TableCell className="text-center font-bold bg-blue-50/50 text-blue-900 border-r border-gray-200">{result.marksObtained} / {result.Exam.totalMarks}{percentage !== null ? ` (${percentage.toFixed(1)}%)` : ''}</TableCell>
                  <TableCell className="text-center border-r border-gray-100">{result.grade ?? 'Unassigned'}</TableCell>
                  <TableCell className="text-right text-sm text-gray-600">{result.remarks ?? '—'}</TableCell>
                </TableRow>;
              })}
            </TableBody>
          </Table>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Attendance Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Attendance Records</span><span className="font-bold">{attendanceLoading ? '—' : attendanceError ? 'Not available' : attendance.length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Present</span><span className="font-bold text-green-600">{attendanceLoading || attendanceError ? '—' : present}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Absent</span><span className="font-bold text-red-600">{attendanceLoading || attendanceError ? '—' : absent}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Late</span><span className="font-bold text-amber-600">{attendanceLoading || attendanceError ? '—' : late}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Attendance Rate</span><span className="font-bold text-blue-900">{attendanceLoading || attendanceError || attendancePercentage === null ? 'Not available' : `${attendancePercentage.toFixed(1)}%`}</span></div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Exam Remarks</h3>
              {resultsLoading && <p className="text-sm text-gray-500">Loading remarks...</p>}
              {!resultsLoading && !resultsError && remarks.length === 0 && <p className="text-sm text-gray-500 italic">No remarks are available for your results.</p>}
              {remarks.slice(0, 3).map((result) => <p key={result.id} className="text-sm text-gray-700 leading-relaxed mb-3"><span className="font-semibold">{result.Exam.title}:</span> {result.remarks}</p>)}
              <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between"><span className="text-xs font-bold text-gray-500">Overall comment</span><span className="text-[10px] text-gray-400 font-mono">NOT AVAILABLE</span></div>
            </div>

            <div className="flex flex-col justify-center items-center bg-blue-50/50 rounded-2xl border border-blue-100 p-8 text-center relative overflow-hidden">
              <Award className="w-16 h-16 text-blue-100 absolute -top-4 -right-4 rotate-12" />
              <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-2 relative z-10">Overall Average</h3>
              <p className="text-5xl font-black text-blue-900 mb-2 relative z-10">{resultsLoading || resultsError || average === null ? '—' : `${average.toFixed(1)}%`}</p>
              <p className="text-xs font-bold text-blue-600 relative z-10">Based on {results.length} recorded exam{results.length === 1 ? '' : 's'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
