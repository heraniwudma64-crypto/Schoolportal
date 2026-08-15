import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Layers } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAcademicYears, getGradeLevels, getSubjects, assignSubjectToGrade } from '../../api/academicStructure';
import { toast } from 'sonner';

export const AssignSubjectsDialog = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  
  const { data: academicYears = [] } = useQuery({ queryKey: ['academicYears'], queryFn: getAcademicYears });
  const { data: gradeLevels = [] } = useQuery({ queryKey: ['gradeLevels'], queryFn: getGradeLevels });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: getSubjects });

  const [academicYearId, setAcademicYearId] = useState('');
  const [gradeLevelId, setGradeLevelId] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const assignMutation = useMutation({
    mutationFn: (data: { gradeId: string, subjectId: string, yearId?: string }) => 
      assignSubjectToGrade(data.gradeId, { subjectId: data.subjectId, academicYearId: data.yearId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gradeLevels'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to assign subject')
  });

  const handleAssign = async () => {
    if (!gradeLevelId || selectedSubjects.length === 0) {
      toast.error('Please select a grade and at least one subject');
      return;
    }

    try {
      for (const subjectId of selectedSubjects) {
        await assignMutation.mutateAsync({ gradeId: gradeLevelId, subjectId, yearId: academicYearId || undefined });
      }
      toast.success('Subjects assigned successfully');
      setOpen(false);
      setSelectedSubjects([]);
      setGradeLevelId('');
    } catch (e) {
      // errors handled by mutation
    }
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20">
          <Layers className="w-4 h-4" />
          Assign Subjects
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Assign Subjects to Grade</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label>Academic Year (Optional)</Label>
            <select 
              className="w-full p-2 border rounded-md mt-1"
              value={academicYearId} 
              onChange={e => setAcademicYearId(e.target.value)}
            >
              <option value="">All Years / General Assignment...</option>
              {academicYears.map(y => (
                <option key={y.id} value={y.id}>{y.year}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Grade Level</Label>
            <select 
              className="w-full p-2 border rounded-md mt-1"
              value={gradeLevelId} 
              onChange={e => setGradeLevelId(e.target.value)}
            >
              <option value="">Select Grade...</option>
              {gradeLevels.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          
          {gradeLevelId && (
            <div>
              <Label>Select Subjects</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto p-2 border rounded-xl bg-gray-50">
                {subjects.map(s => (
                  <div key={s.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border shadow-sm">
                    <input 
                      type="checkbox"
                      checked={selectedSubjects.includes(s.id)}
                      onChange={() => toggleSubject(s.id)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span className="text-sm font-bold">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            className="w-full mt-4 bg-blue-900"
            onClick={handleAssign}
            disabled={assignMutation.isPending || !gradeLevelId || selectedSubjects.length === 0}
          >
            {assignMutation.isPending ? 'Assigning...' : 'Assign Selected Subjects'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
