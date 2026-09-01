import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react';
import { getAcademicYears } from '../../api/academicStructure';
import { api } from '../../lib/api';

type ConsolidatedRosterData = {
  section: { name: string; grade?: string; homeroomTeacher: string | null };
  subjects: Array<{ id: string; name: string; code: string }>;
  students: Array<{
    studentId: string;
    admissionNo: string;
    studentName: string;
    sex: string;
    subjectScores: Array<{
      subjectId: string;
      subject: string;
      term1: number | null;
      term2: number | null;
      term3: number | null;
      term4: number | null;
      sem1Avg: number | null;
      sem2Avg: number | null;
      yearlyAverage: number | null;
    }>;
    sum: number;
    average: number | null;
    rank: number;
    absentDays: number;
    conduct: string | null;
  }>;
};

export default function HomeroomRosterRedesigned() {
  const [data, setData] = useState<ConsolidatedRosterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [editedData, setEditedData] = useState<ConsolidatedRosterData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [context, years] = await Promise.all([
          api.get<{ assignedSection: { id: string } | null }>('/teachers/me/homeroom-context'),
          getAcademicYears(),
        ]);
        const year = years.find((item) => item.isCurrent) || years[0];
        if (!context.assignedSection || !year) throw new Error('No homeroom section or academic year is assigned');
        
        const rosterData = await api.get<ConsolidatedRosterData>(
          `/roster/consolidated?academicYearId=${year.id}&classSectionId=${context.assignedSection.id}`
        );
        setData(rosterData);
        setEditedData(rosterData);
      } catch (err: any) {
        setError(err.message || 'Could not load the consolidated roster');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!data) return;
    // Generate CSV
    const headers = ['No', 'Name', 'Sex', ...data.subjects.flatMap(s => [
      `${s.code} 1st`, `${s.code} 2nd`, `${s.code} 3rd`, `${s.code} 4th`, 
      `${s.code} Ave1`, `${s.code} Ave2`, `${s.code} Year`
    ]), 'Sum', 'Avg', 'Rank', 'Abs D', 'Conduct'];
    
    const rows = data.students.map((student, idx) => {
      const row = [idx + 1, `${student.admissionNo} ${student.studentName}`, student.sex];
      student.subjectScores.forEach(score => {
        row.push(score.term1 ?? '', score.term2 ?? '', score.term3 ?? '', score.term4 ?? '', 
                 score.sem1Avg ?? '', score.sem2Avg ?? '', score.yearlyAverage ?? '');
      });
      row.push(student.sum, student.average ?? '', student.rank || '', student.absentDays, student.conduct || '');
      return row;
    });

    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `${data.section.name}-Roster.csv`;
    link.click();
  };

  if (loading) return <div className="flex items-center justify-center h-96 text-gray-500">Loading consolidated roster...</div>;
  if (error) return <div className="text-red-600 p-4">{error}</div>;
  if (!data) return <div className="text-gray-500 p-4">No roster data available</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Consolidated Roster</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data.section.grade ? `${data.section.grade} ` : ''}{data.section.name}
            {data.section.homeroomTeacher && ` • Homeroom: ${data.section.homeroomTeacher}`}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button
            onClick={() => setViewMode(viewMode === 'view' ? 'edit' : 'view')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
          >
            {viewMode === 'view' ? 'Edit' : 'View'}
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Main Table - Scrollable */}
      <div className="bg-white border rounded-xl overflow-auto shadow-sm">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            {/* Header Row 1: Subject Names */}
            <tr className="bg-gray-900 text-white">
              <th className="border border-gray-300 p-2 text-left" rowSpan={3}>No</th>
              <th className="border border-gray-300 p-2 text-left" rowSpan={3} style={{ minWidth: '150px' }}>Name</th>
              <th className="border border-gray-300 p-2 text-center" rowSpan={3}>Sex</th>

              {data.subjects.map((subject) => (
                <th
                  key={subject.id}
                  className="border border-gray-300 p-2 text-center bg-gray-800"
                  colSpan={7}
                  style={{ minWidth: '140px' }}
                >
                  {subject.name}
                </th>
              ))}

              <th className="border border-gray-300 p-2 text-center" rowSpan={3}>Sum</th>
              <th className="border border-gray-300 p-2 text-center" rowSpan={3}>Avg</th>
              <th className="border border-gray-300 p-2 text-center" rowSpan={3}>Rank</th>
              <th className="border border-gray-300 p-2 text-center" rowSpan={3}>Abs D</th>
              <th className="border border-gray-300 p-2 text-center" rowSpan={3}>Conduct</th>
            </tr>

            {/* Header Row 2: Quarter/Semester Averages */}
            <tr className="bg-gray-700 text-white">
              {data.subjects.map((subject) => (
                <React.Fragment key={`${subject.id}-row2`}>
                  <th className="border border-gray-300 p-2 text-center">1st</th>
                  <th className="border border-gray-300 p-2 text-center">2nd</th>
                  <th className="border border-gray-300 p-2 text-center">3rd</th>
                  <th className="border border-gray-300 p-2 text-center">4th</th>
                  <th className="border border-gray-300 p-2 text-center bg-blue-700">Ave1</th>
                  <th className="border border-gray-300 p-2 text-center bg-blue-700">Ave2</th>
                  <th className="border border-gray-300 p-2 text-center bg-green-700">Year</th>
                </React.Fragment>
              ))}
            </tr>

            {/* Header Row 3: Subject Codes (Optional) */}
            <tr className="bg-gray-600 text-white text-xs">
              {data.subjects.map((subject) => (
                <React.Fragment key={`${subject.id}-row3`}>
                  {[subject.code, subject.code, subject.code, subject.code, subject.code, subject.code, subject.code].map(
                    (code, idx) => (
                      <th key={`${subject.id}-${idx}`} className="border border-gray-300 p-1 text-center">
                        {code}
                      </th>
                    )
                  )}
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.students.map((student, rowIdx) => (
              <tr key={student.studentId} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 p-2 text-center font-semibold">{rowIdx + 1}</td>
                <td className="border border-gray-300 p-2 text-left font-semibold">
                  {student.admissionNo} {student.studentName}
                </td>
                <td className="border border-gray-300 p-2 text-center">{student.sex}</td>

                {student.subjectScores.map((score) => (
                  <React.Fragment key={score.subjectId}>
                    <td className="border border-gray-300 p-2 text-center">
                      {viewMode === 'view' ? (
                        score.term1 ?? '-'
                      ) : (
                        <input type="number" defaultValue={score.term1 ?? ''} className="w-full border rounded p-1" />
                      )}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {viewMode === 'view' ? score.term2 ?? '-' : <input type="number" defaultValue={score.term2 ?? ''} className="w-full border rounded p-1" />}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {viewMode === 'view' ? score.term3 ?? '-' : <input type="number" defaultValue={score.term3 ?? ''} className="w-full border rounded p-1" />}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {viewMode === 'view' ? score.term4 ?? '-' : <input type="number" defaultValue={score.term4 ?? ''} className="w-full border rounded p-1" />}
                    </td>
                    <td className="border border-gray-300 p-2 text-center bg-blue-50 font-semibold">
                      {score.sem1Avg?.toFixed(1) ?? '-'}
                    </td>
                    <td className="border border-gray-300 p-2 text-center bg-blue-50 font-semibold">
                      {score.sem2Avg?.toFixed(1) ?? '-'}
                    </td>
                    <td className="border border-gray-300 p-2 text-center bg-green-50 font-bold">
                      {score.yearlyAverage?.toFixed(1) ?? '-'}
                    </td>
                  </React.Fragment>
                ))}

                <td className="border border-gray-300 p-2 text-center font-semibold">{student.sum}</td>
                <td className="border border-gray-300 p-2 text-center font-semibold">{student.average?.toFixed(1) ?? '-'}</td>
                <td className="border border-gray-300 p-2 text-center font-bold">{student.rank || '-'}</td>
                <td className="border border-gray-300 p-2 text-center">{student.absentDays}</td>
                <td className="border border-gray-300 p-2 text-center font-semibold">{student.conduct || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
            table { font-size: 8px; }
            @page { size: A4 landscape; margin: 0.5cm; }
          }
        `}
      </style>
    </div>
  );
}
