import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { getAcademicYears, getGradeLevels } from '../../api/academicStructure';
import { api } from '../../lib/api';
import { enrollStudent } from '../../api/roster';
import { toast } from 'sonner';

interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAcademicYearId?: string;
  defaultGradeLevelId?: string;
  defaultClassSectionId?: string;
}

export const EnrollStudentModal = ({ isOpen, onClose, defaultAcademicYearId, defaultGradeLevelId, defaultClassSectionId }: EnrollStudentModalProps) => {
  const queryClient = useQueryClient();

  const [academicYearId, setAcademicYearId] = useState<string>(defaultAcademicYearId || '');
  const [gradeLevelId, setGradeLevelId] = useState<string>(defaultGradeLevelId || '');
  const [classSectionId, setClassSectionId] = useState<string>(defaultClassSectionId || '');
  const [studentId, setStudentId] = useState<string>('');
  const [enrollmentDate, setEnrollmentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<string>('ACTIVE');

  // Fetch Academic Years
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academicYears'],
    queryFn: getAcademicYears
  });

  // Fetch Grade Levels
  const { data: gradeLevels = [] } = useQuery({
    queryKey: ['gradeLevels'],
    queryFn: getGradeLevels
  });

  // Fetch Students (role=STUDENT)
  const { data: studentsResponse } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get<any>('/users?role=STUDENT&limit=1000') // Adjusting limit for simplified fetch
  });

  const students = studentsResponse?.data || [];

  const selectedGrade = gradeLevels.find(g => g.id === gradeLevelId);
  const sections = selectedGrade?.ClassSection || [];

  const enrollMutation = useMutation({
    mutationFn: enrollStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster'] });
      queryClient.invalidateQueries({ queryKey: ['rosterSummary'] });
      toast.success('Student enrolled successfully');
      onClose();
      setStudentId('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to enroll student');
    }
  });

  const handleEnroll = () => {
    if (!academicYearId || !gradeLevelId || !classSectionId || !studentId || !enrollmentDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    enrollMutation.mutate({
      studentId,
      academicYearId,
      gradeLevelId,
      classSectionId,
      enrollmentDate,
      status
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enroll Student</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label>Academic Year</Label>
            <Select value={academicYearId} onValueChange={setAcademicYearId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map(year => (
                  <SelectItem key={year.id} value={year.id}>{year.year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Grade Level</Label>
            <Select value={gradeLevelId} onValueChange={(val) => {
              setGradeLevelId(val);
              setClassSectionId(''); // Reset section when grade changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select Grade Level" />
              </SelectTrigger>
              <SelectContent>
                {gradeLevels.map(grade => (
                  <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Class Section</Label>
            <Select value={classSectionId} onValueChange={setClassSectionId} disabled={!gradeLevelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Class Section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map(section => (
                  <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>
                ))}
                {sections.length === 0 && (
                  <SelectItem value="none" disabled>No sections available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.Student?.admissionNo} - {u.Student?.firstName} {u.Student?.lastName}
                  </SelectItem>
                ))}
                {students.length === 0 && (
                  <SelectItem value="none" disabled>No students found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Enrollment Date</Label>
            <Input type="date" value={enrollmentDate} onChange={(e) => setEnrollmentDate(e.target.value)} />
          </div>

          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleEnroll} disabled={enrollMutation.isPending}>
              {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
