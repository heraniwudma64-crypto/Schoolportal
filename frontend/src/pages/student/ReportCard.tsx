import React from 'react';
import { MOCK_RESULTS, MOCK_SUBJECTS, MOCK_USERS } from '../../data/mockData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { GraduationCap, Download, Printer, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../config/branding';

const ReportCard = () => {
  const { user } = useAuth();

  // Helper to calculate semester and yearly averages
  const calculateStats = (subjectId: string) => {
    const q1 = MOCK_RESULTS.find(r => r.subjectId === subjectId && r.quarter === 1)?.total || 0;
    const q2 = MOCK_RESULTS.find(r => r.subjectId === subjectId && r.quarter === 2)?.total || 0;
    const q3 = MOCK_RESULTS.find(r => r.subjectId === subjectId && r.quarter === 3)?.total || 0;
    const q4 = MOCK_RESULTS.find(r => r.subjectId === subjectId && r.quarter === 4)?.total || 0;

    const s1 = (q1 + q2) / 2 || q1 || q2 || 0;
    const s2 = (q3 + q4) / 2 || q3 || q4 || 0;
    const final = (s1 + s2) / 2 || s1 || s2 || 0;

    return { q1, q2, q3, q4, s1, s2, final };
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between no-print">
        <h2 className="text-2xl font-bold text-gray-900">Academic Report Card</h2>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 bg-[#1e3a8a] text-white flex flex-col md:flex-row justify-between gap-8">
          <div className="flex gap-6">
            <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black mb-1">{APP_NAME}</h1>
              <p className="text-blue-200 text-sm font-bold uppercase tracking-widest">Official Academic Report</p>
              <div className="mt-4 flex gap-4 text-xs text-blue-100 font-medium">
                <span>ACADEMIC YEAR: 2023 - 2024</span>
                <span className="w-px h-4 bg-white/20"></span>
                <span>GRADE: {user?.grade}</span>
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col justify-end">
            <p className="text-sm font-bold text-blue-200 uppercase mb-1">Student Information</p>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-sm text-blue-100 italic">ID: {user?.idNumber}</p>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-8">
          <Table className="border border-gray-100">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[200px] font-black text-gray-900 border-r border-gray-100">Subject Name</TableHead>
                <TableHead className="text-center font-bold border-r border-gray-100">Q1</TableHead>
                <TableHead className="text-center font-bold border-r border-gray-100">Q2</TableHead>
                <TableHead className="text-center font-black bg-blue-50 text-blue-900 border-r border-gray-200">SEM 1</TableHead>
                <TableHead className="text-center font-bold border-r border-gray-100">Q3</TableHead>
                <TableHead className="text-center font-bold border-r border-gray-100">Q4</TableHead>
                <TableHead className="text-center font-black bg-blue-50 text-blue-900 border-r border-gray-200">SEM 2</TableHead>
                <TableHead className="text-right font-black bg-blue-900 text-white">YEARLY</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_SUBJECTS.map((subject) => {
                const stats = calculateStats(subject.id);
                return (
                  <TableRow key={subject.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-semibold text-gray-900 border-r border-gray-100">{subject.name}</TableCell>
                    <TableCell className="text-center border-r border-gray-100">{stats.q1 || '-'}</TableCell>
                    <TableCell className="text-center border-r border-gray-100">{stats.q2 || '-'}</TableCell>
                    <TableCell className="text-center font-bold bg-blue-50/50 text-blue-900 border-r border-gray-200">{stats.s1 || '-'}</TableCell>
                    <TableCell className="text-center border-r border-gray-100">{stats.q3 || '-'}</TableCell>
                    <TableCell className="text-center border-r border-gray-100">{stats.q4 || '-'}</TableCell>
                    <TableCell className="text-center font-bold bg-blue-50/50 text-blue-900 border-r border-gray-200">{stats.s2 || '-'}</TableCell>
                    <TableCell className="text-right font-black bg-blue-900/5 text-blue-900">{stats.final || '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Footer Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Attendance Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Days</span>
                  <span className="font-bold">180</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Present</span>
                  <span className="font-bold text-green-600">172</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Absent</span>
                  <span className="font-bold text-red-600">5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Late</span>
                  <span className="font-bold text-amber-600">3</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Teacher's Comments</h3>
              <p className="text-sm text-gray-700 italic leading-relaxed">
                "Abebe has shown exceptional growth this semester, especially in Mathematics. His participation in class discussions is commendable. Keep up the great work!"
              </p>
              <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Principal's Signature</span>
                <div className="w-24 h-8 bg-gray-200/50 rounded flex items-center justify-center text-[10px] text-gray-400 font-mono">
                  [DIGITALLY SIGNED]
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center items-center bg-blue-50/50 rounded-2xl border border-blue-100 p-8 text-center relative overflow-hidden">
              <Award className="w-16 h-16 text-blue-100 absolute -top-4 -right-4 rotate-12" />
              <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-2 relative z-10">Final yearly Result</h3>
              <p className="text-5xl font-black text-blue-900 mb-2 relative z-10">PASSED</p>
              <p className="text-xs font-bold text-blue-600 relative z-10">Promoted to next grade level</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
