import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import ConfirmDialog from '../ConfirmDialog';
import { ScheduleEntry, SchedulePeriod } from '../../../api/timetable';
import { teacherAssignmentsApi } from '../../../api/teacherAssignments';
import { toast } from 'sonner';
import { User, Calendar, Clock, MapPin, AlertCircle, BookOpen } from 'lucide-react';

interface LessonEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  dayOfWeek: string;
  dayLabel: string;
  period: SchedulePeriod | null;
  initialEntry?: ScheduleEntry | null;
  academicYearId: string;
  classSectionId: string;
  defaultRoomNumber?: string | null;
  scheduleStatus: 'DRAFT' | 'PUBLISHED';
  workingEntries: ScheduleEntry[];
  onSaveWorkingEntries: (updatedEntries: ScheduleEntry[]) => void;
}

export const LessonEditorDialog: React.FC<LessonEditorDialogProps> = ({
  isOpen,
  onClose,
  mode,
  dayOfWeek,
  dayLabel,
  period,
  initialEntry,
  academicYearId,
  classSectionId,
  defaultRoomNumber,
  scheduleStatus,
  workingEntries,
  onSaveWorkingEntries,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [roomOverride, setRoomOverride] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Fetch subject-teacher assignments for this academic year
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['teacher-assignments', 'subject', academicYearId],
    queryFn: () => teacherAssignmentsApi.getSubjectAssignments(academicYearId),
    enabled: isOpen && !!academicYearId,
  });

  // Filter assignments exclusively for the selected class section
  const sectionAssignments = useMemo(() => {
    return assignments.filter((a) => a.classSectionId === classSectionId);
  }, [assignments, classSectionId]);

  // Sync form state when dialog opens or target entry/period changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialEntry) {
        setSelectedSubjectId(initialEntry.subjectId || '');
        setRoomOverride(initialEntry.roomOverride || '');
      } else {
        setSelectedSubjectId('');
        setRoomOverride('');
      }
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, mode, initialEntry, period, dayOfWeek]);

  // Auto-resolve teacher strictly from SectionSubjectTeacher assignment
  const selectedAssignment = useMemo(() => {
    return sectionAssignments.find((a) => a.subject?.id === selectedSubjectId);
  }, [sectionAssignments, selectedSubjectId]);

  const resolvedTeacher = selectedAssignment?.teacher || null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!period) {
      toast.error('Period is required');
      return;
    }

    if (period.isBreak) {
      toast.error('Lessons cannot be placed in a break period');
      return;
    }

    if (!selectedSubjectId) {
      toast.error('Please select a subject');
      return;
    }

    if (!resolvedTeacher) {
      toast.error('Unable to resolve assigned teacher. Please assign a teacher in Teacher Assignments first.');
      return;
    }

    setIsSubmitting(true);

    const normDay = dayOfWeek.toUpperCase().trim();
    const cleanRoom = roomOverride.trim() || undefined;

    try {
      // Filter out any existing entry at the exact (dayOfWeek, periodId) slot
      const remainingEntries = workingEntries.filter(
        (entry) =>
          !(
            (entry.dayOfWeek || '').toUpperCase().trim() === normDay &&
            entry.periodId === period.id
          )
      );

      const updatedEntry: ScheduleEntry = {
        id: initialEntry?.id || `local-${Date.now()}`,
        dayOfWeek: normDay,
        periodId: period.id,
        period: {
          id: period.id,
          academicYearId: period.academicYearId,
          periodNumber: period.periodNumber,
          name: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          isBreak: period.isBreak,
          isActive: period.isActive,
          displayOrder: period.displayOrder,
          createdAt: period.createdAt,
          updatedAt: period.updatedAt,
        },
        subjectId: selectedSubjectId,
        subject: {
          id: selectedAssignment!.subject.id,
          name: selectedAssignment!.subject.name,
          code: selectedAssignment!.subject.code,
        },
        teacherId: resolvedTeacher.id,
        teacher: {
          id: resolvedTeacher.id,
          firstName: resolvedTeacher.name.split(' ')[0] || '',
          lastName: resolvedTeacher.name.split(' ').slice(1).join(' ') || '',
          staffId: resolvedTeacher.staffId || null,
        },
        roomOverride: cleanRoom || null,
        effectiveRoom: cleanRoom || defaultRoomNumber || null,
      };

      onSaveWorkingEntries([...remainingEntries, updatedEntry]);
      toast.success(
        scheduleStatus === 'PUBLISHED'
          ? 'Lesson updated in staged schedule (Unpublished)'
          : 'Lesson updated in working draft (Unsaved)'
      );
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to update working lesson.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!initialEntry) return;

    const normDay = dayOfWeek.toUpperCase().trim();
    const remaining = workingEntries.filter(
      (entry) =>
        !(
          (entry.dayOfWeek || '').toUpperCase().trim() === normDay &&
          entry.periodId === period?.id
        )
    );

    onSaveWorkingEntries(remaining);
    toast.success(
      scheduleStatus === 'PUBLISHED'
        ? 'Lesson removed from staged schedule (Unpublished)'
        : 'Lesson removed from working draft (Unsaved)'
    );
    setShowDeleteConfirm(false);
    onClose();
  };

  if (!period) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-900" />
              <span>{mode === 'create' ? 'Add Timetable Lesson' : 'Edit Timetable Lesson'}</span>
            </DialogTitle>
            {scheduleStatus === 'PUBLISHED' && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mt-1">
                <span>Published Schedule • Live timetable protection active (staged edit)</span>
              </div>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* 1. Day & Period Context (Read-only) */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="space-y-1">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <Calendar className="w-3 h-3" /> Day
                </span>
                <span className="text-xs font-bold text-gray-800">{dayLabel}</span>
              </div>
              <div className="space-y-1">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <Clock className="w-3 h-3" /> Period
                </span>
                <span className="text-xs font-bold text-gray-800">
                  {period.name} ({period.startTime}–{period.endTime})
                </span>
              </div>
            </div>

            {/* 2. Subject Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="lesson-subject-select" className="text-xs font-bold text-gray-700">
                Subject <span className="text-red-500">*</span>
              </Label>
              {loadingAssignments ? (
                <div className="h-10 bg-gray-100 animate-pulse rounded-xl" />
              ) : sectionAssignments.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    No subjects are assigned to this class section. Assign subjects and teachers in Teacher Assignments before adding lessons.
                  </span>
                </div>
              ) : (
                <select
                  id="lesson-subject-select"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  required
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-900/20 outline-none transition-all"
                >
                  <option value="">Select an assigned subject...</option>
                  {sectionAssignments.map((a) => (
                    <option key={a.subject?.id} value={a.subject?.id}>
                      {a.subject?.name} {a.subject?.code ? `(${a.subject.code})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3. Auto-Resolved Teacher Display */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                Assigned Teacher <span className="text-gray-400 font-normal">(Auto-resolved)</span>
              </Label>
              {selectedSubjectId ? (
                resolvedTeacher ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800">
                    <User className="w-4 h-4 text-blue-900 flex-shrink-0" />
                    <span>
                      {resolvedTeacher.name} {resolvedTeacher.staffId ? `(${resolvedTeacher.staffId})` : ''}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>Unable to resolve assigned teacher. Assign a teacher in Teacher Assignments first.</span>
                  </div>
                )
              ) : (
                <div className="p-3 bg-gray-50/70 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400">
                  Select a subject to view assigned teacher
                </div>
              )}
            </div>

            {/* 4. Room Override */}
            <div className="space-y-1.5">
              <Label htmlFor="lesson-room-override" className="text-xs font-bold text-gray-700">
                Room Override <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="lesson-room-override"
                  placeholder={defaultRoomNumber ? `Default: Room ${defaultRoomNumber}` : 'e.g. Science Lab 2, Room 301'}
                  value={roomOverride}
                  onChange={(e) => setRoomOverride(e.target.value)}
                  className="h-11 rounded-xl pr-9 text-sm"
                />
                <MapPin className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
              </div>
              <p className="text-[11px] text-gray-400">
                Leave empty to use the class section default room ({defaultRoomNumber || 'None'}).
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-2">
              {mode === 'edit' ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl text-xs font-bold"
                >
                  Delete Lesson
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedSubjectId || !resolvedTeacher}
                  className="bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : mode === 'create'
                    ? 'Add Lesson'
                    : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete this lesson?"
        description="This lesson will be removed from your working schedule. Remember to save your draft to persist changes."
        confirmLabel="Delete"
        variant="danger"
        isLoading={false}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
