import React from 'react';
import { MOCK_RESULTS, MOCK_SUBJECTS } from '../../data/mockData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { GraduationCap, TrendingUp, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const Results = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Academic Results</h2>
        <div className="flex gap-2">
          <select className="bg-white border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20">
            <option>Quarter 1</option>
            <option>Quarter 2</option>
            <option>Quarter 3</option>
            <option>Quarter 4</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="font-bold">Subject</TableHead>
                <TableHead className="font-bold text-center">Mid-Term (20)</TableHead>
                <TableHead className="font-bold text-center">Assignment (20)</TableHead>
                <TableHead className="font-bold text-center">Quiz (10)</TableHead>
                <TableHead className="font-bold text-center">Class Work (10)</TableHead>
                <TableHead className="font-bold text-center">Final (40)</TableHead>
                <TableHead className="font-bold text-right">Total (100)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_RESULTS.map((result) => {
                const subject = MOCK_SUBJECTS.find(s => s.id === result.subjectId);
                return (
                  <TableRow key={result.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-semibold text-gray-900">{subject?.name}</TableCell>
                    <TableCell className="text-center">{result.components.midTerm}</TableCell>
                    <TableCell className="text-center">{result.components.assignment}</TableCell>
                    <TableCell className="text-center">{result.components.quiz}</TableCell>
                    <TableCell className="text-center">{result.components.classWork}</TableCell>
                    <TableCell className="text-center">{result.components.finalExam}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-bold px-3 py-1 rounded-full",
                        result.total >= 90 ? "bg-green-50 text-green-600" : 
                        result.total >= 70 ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {result.total}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-lg">
            <GraduationCap className="w-8 h-8 text-blue-300 mb-4" />
            <h3 className="text-lg font-bold mb-1">Overall Average</h3>
            <p className="text-4xl font-black mb-4">95.0</p>
            <div className="flex items-center gap-2 text-sm text-blue-200">
              <TrendingUp className="w-4 h-4" />
              Top 5% of class
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Grading Scale</h3>
            <div className="space-y-3">
              {[
                { label: 'Excellent', range: '90-100', color: 'bg-green-500' },
                { label: 'Very Good', range: '80-89', color: 'bg-blue-500' },
                { label: 'Good', range: '70-79', color: 'bg-indigo-500' },
                { label: 'Average', range: '60-69', color: 'bg-amber-500' },
                { label: 'Below Avg', range: '0-59', color: 'bg-red-500' },
              ].map((scale) => (
                <div key={scale.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", scale.color)}></div>
                    <span className="text-gray-600">{scale.label}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{scale.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
