import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { getAcademicYears } from '../../api/academicStructure';

type ReportCardData = {
  studentId: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  academicYear: string;
  gradeLevel: string;
  promotedToGrade?: string;
  classSectionName: string;
  homeroomTeacher?: string;
  subjectResults: Array<{
    subjectName: string;
    term1: number | null;
    term2: number | null;
    sem1Avg: number | null;
    term3: number | null;
    term4: number | null;
    sem2Avg: number | null;
    yearlyAvg: number | null;
  }>;
  overallTotal: number;
  overallAverage: number;
  overallRank: number;
  absentDays: number;
  conduct: string;
  behaviourAssessment: {
    academicPotential: string;
    uniform: string;
    timeManagement: string;
    harmfulActions: string;
    responsibilities: string;
    clubActivities: string;
    classworkHomework: string;
    flexibility: string;
    hardWork: string;
    positiveThinking: string;
    obeyingRules: string;
    interpersonalCommunication: string;
  };
  homeroomRemarksSem1?: string;
  homeroomRemarksSem2?: string;
};

export default function ReportCardPrintable() {
  const [students, setStudents] = useState<ReportCardData[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentCardSide, setCurrentCardSide] = useState<'front' | 'back'>('front');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [context, years] = await Promise.all([
          api.get<{ assignedSection: { id: string; name: string } | null }>('/teachers/me/homeroom-context'),
          getAcademicYears(),
        ]);
        const year = years.find((item) => item.isCurrent) || years[0];
        if (!context.assignedSection || !year) throw new Error('No homeroom section assigned');

        // Fetch comprehensive report card data
        const cardsData = await api.get<ReportCardData[]>(
          `/report-cards/compiled?classSectionId=${context.assignedSection.id}&academicYearId=${year.id}`
        );
        setStudents(Array.isArray(cardsData) ? cardsData : []);
        setSelectedStudentIds(cardsData.map((s: any) => s.studentId));
      } catch (err: any) {
        setError(err.message || 'Could not load report cards');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const displayedStudent = students[currentPage];
  const isBackSide = currentCardSide === 'back';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.info('PDF download feature coming soon');
  };

  const nextCard = () => {
    if (currentCardSide === 'front') {
      setCurrentCardSide('back');
    } else if (currentPage < students.length - 1) {
      setCurrentPage(currentPage + 1);
      setCurrentCardSide('front');
    }
  };

  const prevCard = () => {
    if (currentCardSide === 'back') {
      setCurrentCardSide('front');
    } else if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setCurrentCardSide('back');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96 text-gray-500">Loading report cards...</div>;
  if (error) return <div className="text-red-600 p-4">{error}</div>;
  if (!displayedStudent) return <div className="text-gray-500 p-4">No report cards available</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between no-print">
        <h1 className="text-2xl font-bold">Report Cards</h1>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-semibold hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center no-print px-4">
        <button
          onClick={prevCard}
          disabled={currentPage === 0 && currentCardSide === 'front'}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <span className="text-sm text-gray-600">
          {currentPage + 1} of {students.length} ({currentCardSide === 'front' ? 'Front' : 'Back'})
        </span>
        <button
          onClick={nextCard}
          disabled={currentPage === students.length - 1 && currentCardSide === 'back'}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Report Card Container */}
      <div className="bg-white shadow-2xl mx-auto" style={{ width: '8.5in', minHeight: '11in', padding: '0.5in' }}>
        {!isBackSide ? (
          <ReportCardFrontPage student={displayedStudent} />
        ) : (
          <ReportCardBackPage student={displayedStudent} />
        )}
      </div>
    </div>
  );
}

// FRONT PAGE COMPONENT
function ReportCardFrontPage({ student }: { student: ReportCardData }) {
  return (
    <div className="h-full flex flex-col space-y-4 text-xs" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-2">
        <h1 className="text-lg font-bold">Mentor Academy, from Kindergarten - High School</h1>
        <p className="text-xs font-semibold">STUDENT REPORT CARD</p>
      </div>

      {/* Student Information Section */}
      <div className="grid grid-cols-2 gap-4 border-b pb-3">
        <div>
          <p className="font-bold">Student's Name: <span className="font-normal">{student.firstName} {student.lastName}</span></p>
          <p className="font-bold">Grade: <span className="font-normal">{student.gradeLevel}</span></p>
          <p className="font-bold">Age: <span className="font-normal">{student.age}</span></p>
        </div>
        <div>
          <p className="font-bold">Sex: <span className="font-normal">{student.gender}</span></p>
          <p className="font-bold">Academic Year: <span className="font-normal">{student.academicYear}</span></p>
          <p className="font-bold">Promoted to Grade: <span className="font-normal">{student.promotedToGrade || 'Pending'}</span></p>
        </div>
      </div>

      {/* Method of Grading Table */}
      <div className="space-y-1">
        <p className="font-bold text-center">METHOD OF GRADING</p>
        <table className="w-full border border-gray-800 text-center text-xs">
          <tbody>
            <tr className="border-b border-gray-800">
              <td className="border-r border-gray-800 p-1">Marks 90-100</td>
              <td className="border-r border-gray-800 p-1">Marks 80-89</td>
              <td className="border-r border-gray-800 p-1">Marks 70-79</td>
              <td className="border-r border-gray-800 p-1">Marks 60-69</td>
              <td className="p-1">Below 60</td>
            </tr>
            <tr>
              <td className="border-r border-gray-800 p-1 font-bold">A</td>
              <td className="border-r border-gray-800 p-1 font-bold">B</td>
              <td className="border-r border-gray-800 p-1 font-bold">C</td>
              <td className="border-r border-gray-800 p-1 font-bold">D</td>
              <td className="p-1 font-bold">F</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Basic Skills & Personal Development Assessment */}
      <div className="space-y-1">
        <p className="font-bold text-center">BASIC SKILLS & PERSONAL DEVELOPMENT</p>
        <table className="w-full border border-gray-800 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-r border-gray-800 p-1 text-left">Competency</th>
              <th className="border-r border-gray-800 p-1 text-center w-10">A</th>
              <th className="border-r border-gray-800 p-1 text-center w-10">B</th>
              <th className="border-r border-gray-800 p-1 text-center w-10">C</th>
              <th className="p-1 text-center w-10">D</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Academic Potential', value: student.behaviourAssessment.academicPotential },
              { label: 'Uniform', value: student.behaviourAssessment.uniform },
              { label: 'Time Management', value: student.behaviourAssessment.timeManagement },
              { label: 'Harmful Actions', value: student.behaviourAssessment.harmfulActions },
              { label: 'Responsibilities', value: student.behaviourAssessment.responsibilities },
              { label: 'Club Activities', value: student.behaviourAssessment.clubActivities },
              { label: 'Classwork/Homework', value: student.behaviourAssessment.classworkHomework },
              { label: 'Flexibility', value: student.behaviourAssessment.flexibility },
              { label: 'Hard Work', value: student.behaviourAssessment.hardWork },
              { label: 'Positive Thinking', value: student.behaviourAssessment.positiveThinking },
              { label: 'Obeying Rules', value: student.behaviourAssessment.obeyingRules },
              { label: 'Interpersonal Communication', value: student.behaviourAssessment.interpersonalCommunication },
            ].map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border-r border-gray-800 p-1">{item.label}</td>
                {(['A', 'B', 'C', 'D'] as const).map((grade, gradeIndex) => (
                  <td key={grade} className={`${gradeIndex < 3 ? 'border-r ' : ''}border-gray-800 p-1 text-center font-bold`}>
                    {item.value === grade ? '✓' : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex-grow" />
      <p className="text-center text-xs text-gray-600">Assessment grades: A, B, C, D</p>
    </div>
  );
}

// BACK PAGE COMPONENT
function ReportCardBackPage({ student }: { student: ReportCardData }) {
  return (
    <div className="h-full flex flex-col space-y-2 text-xs" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-1">
        <h1 className="text-sm font-bold">{student.firstName} {student.lastName} - Academic Results</h1>
      </div>

      {/* Academic Performance Table */}
      <div className="space-y-1">
        <p className="font-bold text-center">ACADEMIC PERFORMANCE</p>
        <table className="w-full border border-gray-800 text-center" style={{ fontSize: '9px' }}>
          <thead>
            <tr className="bg-gray-100 border-b border-gray-800">
              <th className="border-r border-gray-800 p-1 text-left">Subject</th>
              <th colSpan={3} className="border-r border-gray-800 p-1">1st Semester</th>
              <th colSpan={3} className="border-r border-gray-800 p-1">2nd Semester</th>
              <th className="p-1">Yearly Average</th>
            </tr>
            <tr className="border-b border-gray-800">
              <th className="border-r border-gray-800 p-1 text-left">Subject</th>
              <th className="border-r border-gray-800 p-1">1st Qtr</th>
              <th className="border-r border-gray-800 p-1">2nd Qtr</th>
              <th className="border-r border-gray-800 p-1">Average</th>
              <th className="border-r border-gray-800 p-1">3rd Qtr</th>
              <th className="border-r border-gray-800 p-1">4th Qtr</th>
              <th className="border-r border-gray-800 p-1">Average</th>
              <th className="p-1">Average</th>
            </tr>
          </thead>
          <tbody>
            {student.subjectResults.map((subject, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border-r border-gray-800 p-1 text-left font-semibold">{subject.subjectName}</td>
                <td className="border-r border-gray-800 p-1">{subject.term1 ?? '-'}</td>
                <td className="border-r border-gray-800 p-1">{subject.term2 ?? '-'}</td>
                <td className="border-r border-gray-800 p-1 font-semibold">{subject.sem1Avg?.toFixed(1) ?? '-'}</td>
                <td className="border-r border-gray-800 p-1">{subject.term3 ?? '-'}</td>
                <td className="border-r border-gray-800 p-1">{subject.term4 ?? '-'}</td>
                <td className="border-r border-gray-800 p-1 font-semibold">{subject.sem2Avg?.toFixed(1) ?? '-'}</td>
                <td className="p-1 font-bold">{subject.yearlyAvg?.toFixed(1) ?? '-'}</td>
              </tr>
            ))}
            <tr className="bg-gray-200 font-bold border-t-2 border-gray-800">
              <td className="border-r border-gray-800 p-1">TOTALS & AVERAGES</td>
              <td colSpan={6} className="border-r border-gray-800 p-1 text-center">Total: {student.overallTotal.toFixed(1)}</td>
              <td className="p-1 text-center">{student.overallAverage.toFixed(1)}</td>
            </tr>
            <tr className="border-b border-gray-800">
              <td className="border-r border-gray-800 p-1">Rank</td>
              <td colSpan={6} className="border-r border-gray-800 p-1 text-center">{student.overallRank || '-'}</td>
              <td className="p-1" />
            </tr>
            <tr>
              <td className="border-r border-gray-800 p-1">Absent Days (Abs D)</td>
              <td colSpan={6} className="border-r border-gray-800 p-1 text-center">{student.absentDays}</td>
              <td className="p-1" />
            </tr>
            <tr>
              <td className="border-r border-gray-800 p-1">Conduct</td>
              <td colSpan={6} className="border-r border-gray-800 p-1 text-center">{student.conduct}</td>
              <td className="p-1" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Homeroom Remarks */}
      <div className="grid grid-cols-2 gap-2 space-y-1">
        <div>
          <p className="font-bold text-xs">Homeroom Teacher Remark (1st Semester)</p>
          <div className="border border-gray-800 p-2 h-16 text-xs">{student.homeroomRemarksSem1 || '☐ Excellent result   ☐ Good academic performance   ☐ Needs support'}</div>
          <div className="flex gap-4 mt-1 text-xs">
            <div>Teacher: _________</div>
            <div>Signature: _________</div>
            <div>Date: _________</div>
          </div>
        </div>
        <div>
          <p className="font-bold text-xs">Homeroom Teacher Remark (2nd Semester)</p>
          <div className="border border-gray-800 p-2 h-16 text-xs">{student.homeroomRemarksSem2 || '☐ Excellent result   ☐ Good academic performance   ☐ Needs support'}</div>
          <div className="flex gap-4 mt-1 text-xs">
            <div>Teacher: _________</div>
            <div>Signature: _________</div>
            <div>Date: _________</div>
          </div>
        </div>
      </div>

      {/* School Policy & Director Signature */}
      <div className="space-y-1 text-xs">
        <p className="font-bold">School Promotion Policy</p>
        <p className="text-xs">
          Students are promoted if they achieve an average of 60% or higher and satisfy attendance requirements.
          Placement in Special Classes is based on academic performance.
        </p>

        <div className="flex justify-between mt-3">
          <div className="text-center">
            <p className="font-bold text-xs">Director</p>
            <div className="border-t border-gray-800 w-24 mt-2" />
            <p className="text-xs">Name & Signature</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-xs">Official Seal</p>
            <div className="border border-gray-800 w-24 h-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
