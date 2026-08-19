import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, TrendingUp } from 'lucide-react';
import { getMyResults } from '../../api/students';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

const Results = () => {
  const { data: results = [], isLoading, isError } = useQuery({
    queryKey: ['my-results'],
    queryFn: getMyResults,
  });
  const totalObtained = results.reduce((sum, result) => sum + result.marksObtained, 0);
  const totalPossible = results.reduce((sum, result) => sum + result.Exam.totalMarks, 0);
  const average = totalPossible ? (totalObtained / totalPossible) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Academic Results</h2>
        <p className="text-sm text-gray-500">Your published exam results.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="font-bold">Exam</TableHead>
                <TableHead className="font-bold">Subject</TableHead>
                <TableHead className="font-bold">Term</TableHead>
                <TableHead className="font-bold text-center">Score</TableHead>
                <TableHead className="font-bold text-center">Grade</TableHead>
                <TableHead className="font-bold text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="py-8 text-center text-gray-500">Loading results...</TableCell></TableRow>}
              {isError && <TableRow><TableCell colSpan={6} className="py-8 text-center text-red-600">Could not load results.</TableCell></TableRow>}
              {!isLoading && !isError && results.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-gray-500">No results have been published yet.</TableCell></TableRow>}
              {results.map((result) => (
                <TableRow key={result.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-semibold text-gray-900">{result.Exam.title}</TableCell>
                  <TableCell>{result.Exam.Subject.name}</TableCell>
                  <TableCell>{result.Exam.Term?.name ?? '—'}</TableCell>
                  <TableCell className="text-center font-medium">{result.marksObtained} / {result.Exam.totalMarks}</TableCell>
                  <TableCell className="text-center">{result.grade ?? '—'}</TableCell>
                  <TableCell className="text-right">{new Date(result.Exam.examDate).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-lg h-fit">
          <GraduationCap className="w-8 h-8 text-blue-300 mb-4" />
          <h3 className="text-lg font-bold mb-1">Overall Average</h3>
          <p className="text-4xl font-black mb-4">{average.toFixed(1)}%</p>
          <div className="flex items-center gap-2 text-sm text-blue-200">
            <TrendingUp className="w-4 h-4" />
            Based on {results.length} exam{results.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
