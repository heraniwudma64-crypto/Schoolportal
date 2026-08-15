import React, { useState, useEffect } from 'react';
import { MOCK_ASSIGNMENTS } from '../../data/mockData';
import { Badge } from '../../components/ui/badge';
import { FileText, Calendar, Paperclip, ExternalLink, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../components/ui/empty';

const Assignments = ({ searchQuery }: { searchQuery: string }) => {
  const [filteredAssignments, setFilteredAssignments] = useState(MOCK_ASSIGNMENTS);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = MOCK_ASSIGNMENTS.filter(assignment => 
      (assignment.published !== false) && (
        assignment.title.toLowerCase().includes(lowercasedQuery) ||
        assignment.subjectName.toLowerCase().includes(lowercasedQuery) ||
        assignment.description.toLowerCase().includes(lowercasedQuery)
      )
    );
    setFilteredAssignments(filtered);
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Assignments & Homework</h2>
        <div className="flex gap-2">
          <select className="bg-white border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20">
            <option>All Subjects</option>
            <option>Mathematics</option>
            <option>Physics</option>
          </select>
          <select className="bg-white border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20">
            <option>All Status</option>
            <option>Pending</option>
            <option>Submitted</option>
          </select>
        </div>
      </div>
      
      {filteredAssignments.length === 0 ? (
        <Empty className="min-h-[400px]">
          <EmptyMedia>
            <Search className="h-10 w-10" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No assignments found</EmptyTitle>
            <EmptyDescription>
              Your search for "{searchQuery}" did not return any assignments.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4">
        {filteredAssignments.map((assignment) => (
          <div key={assignment.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-200 transition-colors">
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                assignment.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
              )}>
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-gray-900">{assignment.title}</h3>
                  <Badge variant={assignment.status === 'pending' ? 'outline' : 'default'} className={cn(
                    assignment.status === 'pending' ? "text-amber-600 border-amber-200 bg-amber-50" : "text-green-600 border-green-200 bg-green-50"
                  )}>
                    {assignment.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mb-2">{assignment.subjectName} • Prof. Meron Tadesse</p>
                <p className="text-sm text-gray-600 line-clamp-1">{assignment.description}</p>
              </div>
            </div>

            <div className="flex flex-col md:items-end gap-4 shrink-0">
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-medium">DUE DATE</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {assignment.dueDate}
                  </p>
                </div>
                <div className="w-px h-8 bg-gray-100"></div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-medium">MATERIAL</p>
                  <a href="#" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                    <Paperclip className="w-4 h-4" />
                    Resources
                  </a>
                </div>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                {assignment.status === 'pending' ? (
                  <button onClick={() => toast.info('Assignment submission feature coming soon')} className="flex-1 md:flex-none px-6 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2">
                    Submit Work
                    <ExternalLink className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={() => toast.info('Viewing submission feature coming soon')} className="flex-1 md:flex-none px-6 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                    View Submission
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};

export default Assignments;
