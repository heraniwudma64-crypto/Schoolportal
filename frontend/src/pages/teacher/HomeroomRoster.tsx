import React, { useEffect, useState } from 'react';
import { getAcademicYears } from '../../api/academicStructure';
import { api } from '../../lib/api';

type SubjectScore = { subjectId: string; subject: string; terms: Array<number | null>; semesterAverages: Array<number | null>; yearlyAverage: number | null };
type RosterRow = { studentId: string; admissionNo: string; studentName: string; subjectScores: SubjectScore[]; sum: number; average: number | null; rank: number; absentDays: number; conduct: string | null };
type ConsolidatedRoster = { section: { name: string; grade?: string; homeroomTeacher: string | null }; subjects: Array<{ id: string; name: string; code: string }>; students: RosterRow[] };

export default function HomeroomRoster() {
  const [data, setData] = useState<ConsolidatedRoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [context, years] = await Promise.all([
          api.get<{ assignedSection: { id: string } | null }>('/teachers/me/homeroom-context'),
          getAcademicYears(),
        ]);
        const year = years.find((item) => item.isCurrent) || years[0];
        if (!context.assignedSection || !year) throw new Error('No homeroom section or academic year is assigned');
        setData(await api.get<ConsolidatedRoster>(`/roster/consolidated?academicYearId=${year.id}&classSectionId=${context.assignedSection.id}`));
      } catch (err: any) { setError(err.message || 'Could not load the consolidated roster'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <p className="text-gray-500">Preparing consolidated roster...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Consolidated Roster</h1><p className="text-sm text-gray-500">{data.section.grade ? `${data.section.grade} - ` : ''}{data.section.name} | Submitted subject results</p></div><div className="bg-white border rounded-xl overflow-auto"><table className="min-w-[1500px] w-full text-xs"><thead className="bg-gray-50"><tr><th className="p-3 text-left">No.</th><th className="p-3 text-left">Student</th>{data.subjects.map((subject) => <React.Fragment key={subject.id}><th className="p-3 text-center" colSpan={7}>{subject.name}</th></React.Fragment>)}<th className="p-3">Sum</th><th className="p-3">Average</th><th className="p-3">Rank</th><th className="p-3">Abs D</th><th className="p-3">Conduct</th></tr><tr><th /><th />{data.subjects.map((subject) => <React.Fragment key={`${subject.id}-terms`}><th className="p-2">1st</th><th className="p-2">2nd</th><th className="p-2">3rd</th><th className="p-2">4th</th><th className="p-2">Sem A</th><th className="p-2">Sem B</th><th className="p-2">Year</th></React.Fragment>)}<th /><th /><th /><th /><th /></tr></thead><tbody className="divide-y">{data.students.map((student, index) => <tr key={student.studentId}><td className="p-3">{index + 1}</td><td className="p-3 font-semibold whitespace-nowrap">{student.admissionNo} {student.studentName}</td>{student.subjectScores.map((score) => <React.Fragment key={score.subjectId}><>{score.terms.map((value, termIndex) => <td className="p-3 text-center" key={`${score.subject}-${termIndex}`}>{value ?? '-'}</td>)}</><td className="p-3 text-center">{score.semesterAverages[0] ?? '-'}</td><td className="p-3 text-center">{score.semesterAverages[1] ?? '-'}</td><td className="p-3 text-center font-semibold">{score.yearlyAverage ?? '-'}</td></React.Fragment>)}<td className="p-3 text-center font-semibold">{student.sum}</td><td className="p-3 text-center">{student.average ?? '-'}</td><td className="p-3 text-center">{student.rank || '-'}</td><td className="p-3 text-center">{student.absentDays}</td><td className="p-3 text-center">{student.conduct || '-'}</td></tr>)}</tbody></table></div></div>;
}
