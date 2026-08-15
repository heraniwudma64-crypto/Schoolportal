import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAcademicYears, getGradeLevels, getEligibleStudents, promoteStudents } from '../../api/academicStructure';
import { toast } from 'sonner';

export const PromotionDialog = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  
  const { data: academicYears = [] } = useQuery({ queryKey: ['academicYears'], queryFn: getAcademicYears });
  const { data: gradeLevels = [] } = useQuery({ queryKey: ['gradeLevels'], queryFn: getGradeLevels });
  
  const [sourceYearId, setSourceYearId] = useState('');
  const [targetYearId, setTargetYearId] = useState('');
  
  const { data: eligibleStudents = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['eligibleStudents', sourceYearId],
    queryFn: () => getEligibleStudents(sourceYearId),
    enabled: !!sourceYearId,
  });

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [targetGradeId, setTargetGradeId] = useState('');
  const [targetSectionId, setTargetSectionId] = useState('');

  const promotionMutation = useMutation({
    mutationFn: promoteStudents,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gradeLevels'] });
      toast.success(`Successfully promoted ${data.promotedCount} students`);
      setOpen(false);
      resetState();
    },
    onError: (e: any) => toast.error(e.message || 'Promotion failed')
  });

  const resetState = () => {
    setSourceYearId('');
    setTargetYearId('');
    setSelectedStudents([]);
    setTargetGradeId('');
    setTargetSectionId('');
  };

  const handlePromote = () => {
    if (!sourceYearId || !targetYearId || selectedStudents.length === 0 || !targetGradeId || !targetSectionId) {
      toast.error('Please fill all fields and select students');
      return;
    }
    
    const promotions = selectedStudents.map(studentId => ({
      studentId,
      targetGradeLevelId: targetGradeId,
      targetSectionId: targetSectionId,
    }));
    
    promotionMutation.mutate({
      sourceYearId,
      targetYearId,
      promotions,
    });
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const targetGradeSections = gradeLevels.find(g => g.id === targetGradeId)?.ClassSection || [];

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetState(); }}>
      <DialogTrigger asChild>
        <button className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-800 transition-colors shadow-lg">
          YEAR-END PROMOTION
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Year-End Promotion</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Source Academic Year</Label>
              <select 
                className="w-full p-2 border rounded-md mt-1"
                value={sourceYearId} 
                onChange={e => setSourceYearId(e.target.value)}
              >
                <option value="">Select Year...</option>
                {academicYears.map(y => (
                  <option key={y.id} value={y.id}>{y.year}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Target Academic Year</Label>
              <select 
                className="w-full p-2 border rounded-md mt-1"
                value={targetYearId} 
                onChange={e => setTargetYearId(e.target.value)}
              >
                <option value="">Select Year...</option>
                {academicYears.filter(y => y.id !== sourceYearId).map(y => (
                  <option key={y.id} value={y.id}>{y.year}</option>
                ))}
              </select>
            </div>
          </div>

          {sourceYearId && (
            <div className="space-y-4">
              <Label>Select Students to Promote</Label>
              <div className="bg-gray-50 border rounded-xl p-4 max-h-60 overflow-y-auto space-y-2">
                {loadingStudents ? (
                  <p className="text-sm text-gray-500">Loading students...</p>
                ) : eligibleStudents.length === 0 ? (
                  <p className="text-sm text-gray-500">No students found in source year.</p>
                ) : (
                  eligibleStudents.map((enrollment: any) => (
                    <div key={enrollment.studentId} className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.includes(enrollment.studentId)}
                        onChange={() => toggleStudent(enrollment.studentId)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-900">{enrollment.Student?.firstName} {enrollment.Student?.lastName}</p>
                        <p className="text-xs text-gray-500">{enrollment.GradeLevel?.name} - {enrollment.ClassSection?.name}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedStudents(eligibleStudents.map((e: any) => e.studentId))}
              >
                Select All
              </Button>
            </div>
          )}

          {selectedStudents.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Destination Grade</Label>
                <select 
                  className="w-full p-2 border rounded-md mt-1"
                  value={targetGradeId} 
                  onChange={e => {
                    setTargetGradeId(e.target.value);
                    setTargetSectionId(''); // reset section on grade change
                  }}
                >
                  <option value="">Select Grade...</option>
                  {gradeLevels.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Destination Section</Label>
                <select 
                  className="w-full p-2 border rounded-md mt-1"
                  value={targetSectionId} 
                  onChange={e => setTargetSectionId(e.target.value)}
                  disabled={!targetGradeId}
                >
                  <option value="">Select Section...</option>
                  {targetGradeSections.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 border-t mt-auto">
          <Button 
            className="w-full bg-blue-900 hover:bg-blue-800"
            onClick={handlePromote}
            disabled={promotionMutation.isPending || selectedStudents.length === 0}
          >
            {promotionMutation.isPending ? 'Processing...' : `Confirm Promotion (${selectedStudents.length} students)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
