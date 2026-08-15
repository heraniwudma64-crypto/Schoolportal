import React, { useState } from 'react';
import { MOCK_ASSIGNMENTS } from '../../data/mockData';
import { Badge } from '../../components/ui/badge';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const AssignmentPublishing = () => {
  const [assignments, setAssignments] = useState(MOCK_ASSIGNMENTS);

  const handlePublishToggle = (id: string) => {
    setAssignments(assignments.map(a => 
      a.id === id ? { ...a, published: !a.published } : a
    ));
    const assignment = assignments.find(a => a.id === id);
    if (assignment) {
      toast.success(`Assignment "${assignment.title}" has been ${!assignment.published ? 'published' : 'unpublished'}.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Publish Assignments</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors">
          <Plus className="w-4 h-4" />
          New Assignment
        </button>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 gap-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="p-4 border rounded-lg flex items-center justify-between">
              <div>
                <h3 className="font-bold">{assignment.title}</h3>
                <p className="text-sm text-gray-500">{assignment.subjectName} - Due: {assignment.dueDate}</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={assignment.published ? 'default' : 'outline'}>
                  {assignment.published ? 'Published' : 'Draft'}
                </Badge>
                <button onClick={() => handlePublishToggle(assignment.id)} className="text-blue-600 hover:underline">
                  {assignment.published ? 'Unpublish' : 'Publish'}
                </button>
                <button className="p-2 text-gray-500 hover:text-blue-600"><Eye className="w-5 h-5" /></button>
                <button className="p-2 text-gray-500 hover:text-green-600"><Edit className="w-5 h-5" /></button>
                <button className="p-2 text-gray-500 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssignmentPublishing;
