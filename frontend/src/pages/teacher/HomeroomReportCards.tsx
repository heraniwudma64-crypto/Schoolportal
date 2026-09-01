import React, { useEffect, useState } from 'react';
import { getAcademicYears } from '../../api/academicStructure';
import { api } from '../../lib/api';

type Matrix = {
  allSubmitted: boolean;
  matrix?: Array<{ subjectName: string; teacherName: string; isSubmitted: boolean }>;
  subjects?: Array<{ subjectName: string; teacherName: string; isSubmitted: boolean }>;
};
type PreparedRoster = { students: Array<{ studentId: string; admissionNo: string; studentName: string; average: number | null; rank: number }> };

export default function HomeroomReportCards() {
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [preparedRoster, setPreparedRoster] = useState<PreparedRoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  useEffect(() => {
    const load = async () => {
      try {
        const [context, years] = await Promise.all([api.get<{ assignedSection: { id: string } | null }>('/teachers/me/homeroom-context'), getAcademicYears()]);
        const year = years.find((item) => item.isCurrent) || years[0];
        if (!context.assignedSection || !year) throw new Error('No homeroom section or academic year is assigned');
        const sectionId = context.assignedSection.id;
        const [submissionMatrix, roster] = await Promise.all([
          api.get<Matrix>(`/results/homeroom-matrix?classSectionId=${sectionId}&academicYearId=${year.id}&term=TERM_1`),
          api.get<PreparedRoster>(`/roster/consolidated?academicYearId=${year.id}&classSectionId=${sectionId}`),
        ]);
        setMatrix(submissionMatrix);
        setPreparedRoster(roster);
      } catch (err: any) { setMessage(err.message || 'Could not load subject submissions'); }
      finally { setLoading(false); }
    };
    load();
  }, []);
  if (loading) return <p className="text-gray-500">Checking subject submissions...</p>;
  if (message) return <p className="text-red-600">{message}</p>;
  const students = preparedRoster?.students || [];
  const subjectRows = matrix?.matrix ?? matrix?.subjects ?? [];
  const selected = students.filter((student) => selectedStudents.includes(student.studentId));
  const printCards = () => { if (selected.length === 0) return window.alert('Select at least one report card'); setIsPrinting(true); window.setTimeout(() => { window.print(); setIsPrinting(false); }, 0); };
  const exportExcel = () => {
    if (selected.length === 0) return window.alert('Select at least one report card');
    const rows = selected.map((student) => [student.admissionNo, student.studentName, student.average ?? '', student.rank || '']);
    const csv = [['Admission No', 'Student', 'Yearly Average', 'Rank'], ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = 'report-cards.xls'; link.click(); URL.revokeObjectURL(link.href);
  };
  const visibleStudents = isPrinting ? selected : students;
  return <div className="max-w-4xl space-y-6"><div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">Report Card Preparation</h1><p className="text-sm text-gray-500">Compile cards from results submitted by subject teachers.</p></div><div className="flex gap-2 print:hidden"><button onClick={printCards} className="border rounded-lg px-3 py-2 text-sm">Print / PDF</button><button onClick={exportExcel} className="bg-blue-900 text-white rounded-lg px-3 py-2 text-sm">Export Excel</button></div></div><div className="bg-white border rounded-xl p-6 print:hidden"><p className={matrix?.allSubmitted ? 'text-green-700 font-semibold' : 'text-amber-700 font-semibold'}>{matrix?.allSubmitted ? 'All subjects submitted. Report cards are ready to compile.' : 'Waiting for all subject teachers to submit results.'}</p><div className="mt-5 divide-y">{subjectRows.map((item) => <div key={item.subjectName} className="py-3 flex justify-between"><span>{item.subjectName} <span className="text-gray-400">({item.teacherName})</span></span><span className={item.isSubmitted ? 'text-green-700' : 'text-amber-700'}>{item.isSubmitted ? 'Submitted' : 'Pending'}</span></div>)}</div></div><div className="bg-white border rounded-xl overflow-hidden"><div className="p-5 border-b print:hidden"><h2 className="font-bold">Prepared Student Cards</h2><p className="text-sm text-gray-500">Select individual cards or select all for batch printing.</p><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedStudents.length === students.length && students.length > 0} onChange={(event) => setSelectedStudents(event.target.checked ? students.map((student) => student.studentId) : [])} /> Select all</label></div><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-3 print:hidden">Select</th><th className="p-3 text-left">Student</th><th className="p-3 text-center">Yearly Average</th><th className="p-3 text-center">Rank</th></tr></thead><tbody className="divide-y">{visibleStudents.map((student) => <tr key={student.studentId}><td className="p-3 text-center print:hidden"><input type="checkbox" checked={selectedStudents.includes(student.studentId)} onChange={(event) => setSelectedStudents((current) => event.target.checked ? [...current, student.studentId] : current.filter((id) => id !== student.studentId))} /></td><td className="p-3">{student.admissionNo} {student.studentName}</td><td className="p-3 text-center">{student.average ?? '-'}</td><td className="p-3 text-center">{student.rank || '-'}</td></tr>)}</tbody></table></div></div>;
}
