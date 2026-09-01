import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Clock, Users, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { getAcademicYears } from '../../api/academicStructure';
import { api } from '../../lib/api';

type SubmissionStatus = {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  teacherId: string;
  isSubmitted: boolean;
  submittedAt: string | null;
  submittedCount: number;
  enrolledCount: number;
  completionPercentage: number;
};

type SubmissionMatrix = {
  classSectionName: string;
  academicYear: string;
  term: string;
  allSubmitted: boolean;
  subjects: SubmissionStatus[];
  totalSubmitted: number;
  totalSubjects: number;
};

function termCodeFromName(name: string | undefined, index: number) {
  const match = String(name || '').match(/[1-4]/);
  return match ? `TERM_${match[0]}` : `TERM_${index + 1}`;
}

type StudentResult = {
  studentId: string;
  admissionNo: string;
  studentName: string;
  marks: number;
  subjectId: string;
  term: string;
  status: 'DRAFT' | 'SUBMITTED';
};

export default function HomeroomSubmissionMatrix() {
  const [matrix, setMatrix] = useState<SubmissionMatrix | null>(null);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('TERM_1');
  const [terms, setTerms] = useState<Array<{ id: string; name: string }>>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [context, years] = await Promise.all([
          api.get<{ assignedSection: { id: string; name: string } | null }>('/teachers/me/homeroom-context'),
          getAcademicYears(),
        ]);
        
        const year = years.find((item) => item.isCurrent) || years[0];
        if (!context.assignedSection || !year) {
          throw new Error('No homeroom section or academic year assigned');
        }

        // Fetch available terms
        const termsData = await api.get<Array<{ id: string; name: string }>>(
          `/report-cards/filters/terms?academicYearId=${year.id}`
        );
        const resolvedTerms = termsData.length
          ? termsData
          : [{ id: 'TERM_1', name: 'Term 1' }, { id: 'TERM_2', name: 'Term 2' }, { id: 'TERM_3', name: 'Term 3' }, { id: 'TERM_4', name: 'Term 4' }];
        setTerms(resolvedTerms);
        const firstTerm = termCodeFromName(resolvedTerms[0]?.name, 0);
        setSelectedTerm(firstTerm);

        // Fetch submission matrix
        const matrixData = await api.get<SubmissionMatrix>(
          `/results/homeroom-matrix?classSectionId=${context.assignedSection.id}&academicYearId=${year.id}&term=${firstTerm}`
        );
        setMatrix(matrixData);

        // Fetch student results for this term
        const resultsData = await api.get<StudentResult[]>(
          `/results/student-results?classSectionId=${context.assignedSection.id}&academicYearId=${year.id}&term=${firstTerm}`
        );
        setStudentResults(resultsData);
      } catch (err: any) {
        setError(err.message || 'Could not load submission matrix');
        toast.error(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Handle term change
  const handleTermChange = async (newTerm: string) => {
    setSelectedTerm(newTerm);
    try {
      const context = await api.get<{ assignedSection: { id: string } | null }>('/teachers/me/homeroom-context');
      const years = await getAcademicYears();
      const year = years.find((item) => item.isCurrent) || years[0];

      if (context.assignedSection && year) {
        const [matrixData, resultsData] = await Promise.all([
          api.get<SubmissionMatrix>(
            `/results/homeroom-matrix?classSectionId=${context.assignedSection.id}&academicYearId=${year.id}&term=${newTerm}`
          ),
          api.get<StudentResult[]>(
            `/results/student-results?classSectionId=${context.assignedSection.id}&academicYearId=${year.id}&term=${newTerm}`
          ),
        ]);
        setMatrix(matrixData);
        setStudentResults(resultsData);
      }
    } catch (err: any) {
      toast.error('Failed to load data for selected term');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!matrix) return;
    const headers = ['Subject', 'Teacher', 'Status', 'Submitted', 'Total', 'Completion %'];
    const rows = matrix.subjects.map((subject) => [
      subject.subjectName,
      subject.teacherName,
      subject.isSubmitted ? 'Submitted' : 'Pending',
      subject.submittedCount,
      subject.enrolledCount,
      `${subject.completionPercentage}%`,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `submission-matrix-${selectedTerm}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-900 mx-auto mb-3 animate-spin" />
          <p className="text-gray-600">Loading submission matrix...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-bold text-red-900">Error Loading Matrix</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!matrix) {
    return <div className="text-gray-500 p-6">No submission data available</div>;
  }

  const completionPercentage = matrix.totalSubjects
    ? Math.round((matrix.totalSubmitted / matrix.totalSubjects) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subject Results Submission Matrix</h1>
          <p className="text-sm text-gray-600 mt-1">
            {matrix.classSectionName} • {matrix.academicYear} • {selectedTerm}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Term Selector */}
      <div className="bg-white border rounded-lg p-4 no-print">
        <label className="block text-sm font-semibold mb-2">Select Term</label>
        <select
          value={selectedTerm}
          onChange={(e) => handleTermChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          {terms.map((term, index) => (
            <option key={term.id} value={termCodeFromName(term.name, index)}>
              {term.name}
            </option>
          ))}
        </select>
      </div>

      {/* Overall Status Card */}
      <div
        className={`rounded-lg p-6 text-white ${
          matrix.allSubmitted ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-amber-600 to-amber-500'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {matrix.allSubmitted ? 'All Submissions Complete' : 'Submissions Pending'}
            </h2>
            <p className="text-white/80 mt-1">
              {matrix.totalSubmitted} of {matrix.totalSubjects} subjects submitted ({completionPercentage}%)
            </p>
          </div>
          <div className="text-4xl font-bold text-white/30">{completionPercentage}%</div>
        </div>
      </div>

      {/* Submission Table */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-6 py-3 text-left text-sm font-bold">Subject</th>
              <th className="px-6 py-3 text-left text-sm font-bold">Teacher</th>
              <th className="px-6 py-3 text-center text-sm font-bold">Status</th>
              <th className="px-6 py-3 text-center text-sm font-bold">Submitted</th>
              <th className="px-6 py-3 text-center text-sm font-bold">Total</th>
              <th className="px-6 py-3 text-center text-sm font-bold">Completion</th>
              <th className="px-6 py-3 text-center text-sm font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {matrix.subjects.map((subject, idx) => (
              <React.Fragment key={subject.subjectId}>
                <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} style={{ height: '60px' }}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{subject.subjectName}</p>
                      <p className="text-xs text-gray-500">{subject.subjectCode}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{subject.teacherName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {subject.isSubmitted ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-xs font-semibold text-green-600">Submitted</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-600">Pending</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-gray-900">{subject.submittedCount}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-gray-900">{subject.enrolledCount}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            subject.isSubmitted ? 'bg-green-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${subject.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-10 text-right">{subject.completionPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedSubject(selectedSubject === subject.subjectId ? null : subject.subjectId);
                      }}
                      className="text-blue-600 hover:text-blue-900 text-sm font-semibold"
                    >
                      {selectedSubject === subject.subjectId ? 'Hide' : 'View'} Details
                    </button>
                  </td>
                </tr>

                {/* Expandable Details Row */}
                {selectedSubject === subject.subjectId && (
                  <tr className="bg-blue-50">
                    <td colSpan={7} className="px-6 py-4">
                      <div>
                        <h4 className="font-bold text-sm mb-3">Student Results for {subject.subjectName}</h4>
                        <div className="max-h-96 overflow-y-auto">
                          <table className="w-full text-xs border border-gray-300">
                            <thead>
                              <tr className="bg-blue-100">
                                <th className="border border-gray-300 p-2 text-left">Student</th>
                                <th className="border border-gray-300 p-2 text-center">Marks</th>
                                <th className="border border-gray-300 p-2 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentResults
                                .filter((r) => r.subjectId === subject.subjectId && r.term === selectedTerm)
                                .map((result, ridx) => (
                                  <tr key={ridx} className={ridx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                                    <td className="border border-gray-300 p-2">
                                      {result.admissionNo} {result.studentName}
                                    </td>
                                    <td className="border border-gray-300 p-2 text-center font-semibold">
                                      {result.marks}
                                    </td>
                                    <td className="border border-gray-300 p-2 text-center">
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-semibold ${
                                          result.status === 'SUBMITTED'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}
                                      >
                                        {result.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 10mm; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>
    </div>
  );
}
