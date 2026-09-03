import React from 'react';
import { AcademicYear, GradeLevel } from '../../../api/academicStructure';
import {
  Calendar,
  Layers,
  Users,
  AlertCircle,
  RefreshCw,
  Save,
  RotateCcw,
  Send,
  Clock,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { Button } from '../../ui/button';

interface TimetableToolbarProps {
  academicYears: AcademicYear[];
  gradeLevels: GradeLevel[];
  selectedAcademicYearId: string;
  selectedGradeLevelId: string;
  selectedClassSectionId: string;
  onSelectAcademicYear: (yearId: string) => void;
  onSelectGradeLevel: (gradeId: string) => void;
  onSelectClassSection: (sectionId: string) => void;
  isLoadingYears?: boolean;
  isLoadingGrades?: boolean;
  isError?: boolean;
  onRetry?: () => void;

  // Workflow Props (Stage 3.5, 3.6 & 3.7)
  scheduleStatus?: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string | null;
  isDirty?: boolean;
  isSavingDraft?: boolean;
  isPublishing?: boolean;
  onSaveDraft?: () => void;
  onDiscardChanges?: () => void;
  onOpenPreview?: () => void;
  onPublish?: () => void;
}

function formatPublishedDate(dateStr?: string | null): string {
  if (!dateStr) return 'Not published yet';
  try {
    const d = new Date(dateStr);
    return `Last published: ${d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} at ${d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })}`;
  } catch {
    return 'Not published yet';
  }
}

export const TimetableToolbar: React.FC<TimetableToolbarProps> = ({
  academicYears,
  gradeLevels,
  selectedAcademicYearId,
  selectedGradeLevelId,
  selectedClassSectionId,
  onSelectAcademicYear,
  onSelectGradeLevel,
  onSelectClassSection,
  isLoadingYears = false,
  isLoadingGrades = false,
  isError = false,
  onRetry,

  // Workflow Props
  scheduleStatus,
  publishedAt,
  isDirty = false,
  isSavingDraft = false,
  isPublishing = false,
  onSaveDraft,
  onDiscardChanges,
  onOpenPreview,
  onPublish,
}) => {
  const selectedGrade = gradeLevels.find((g) => g.id === selectedGradeLevelId);
  const availableSections = selectedGrade?.ClassSection || [];

  const isLoading = isLoadingYears || isLoadingGrades;

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-red-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">Failed to load academic structure data for timetable management.</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 rounded-xl text-xs font-bold text-red-700 hover:bg-red-100/50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
      {/* 1. Filter Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Academic Year Selector */}
        <div className="space-y-2">
          <label
            htmlFor="timetable-academic-year-select"
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest"
          >
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>Academic Year</span>
          </label>
          <select
            id="timetable-academic-year-select"
            value={selectedAcademicYearId}
            onChange={(e) => onSelectAcademicYear(e.target.value)}
            disabled={isLoadingYears || isPublishing || isSavingDraft || academicYears.length === 0}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {academicYears.length === 0 ? (
              <option value="">No academic years available</option>
            ) : (
              academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year} {year.isCurrent ? '(Current)' : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Grade Level Selector */}
        <div className="space-y-2">
          <label
            htmlFor="timetable-grade-level-select"
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest"
          >
            <Layers className="w-3.5 h-3.5 text-gray-400" />
            <span>Grade Level</span>
          </label>
          <select
            id="timetable-grade-level-select"
            value={selectedGradeLevelId}
            onChange={(e) => onSelectGradeLevel(e.target.value)}
            disabled={isLoading || isPublishing || isSavingDraft || gradeLevels.length === 0}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {gradeLevels.length === 0 ? (
              <option value="">
                {isLoading ? 'Loading grade levels...' : 'No grade levels configured'}
              </option>
            ) : (
              <>
                <option value="">Select a Grade</option>
                {gradeLevels.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* Class Section Selector */}
        <div className="space-y-2">
          <label
            htmlFor="timetable-class-section-select"
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest"
          >
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <span>Class Section</span>
          </label>
          <select
            id="timetable-class-section-select"
            value={selectedClassSectionId}
            onChange={(e) => onSelectClassSection(e.target.value)}
            disabled={
              isLoading ||
              isPublishing ||
              isSavingDraft ||
              !selectedGradeLevelId ||
              availableSections.length === 0
            }
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-900/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!selectedGradeLevelId ? (
              <option value="">Select a grade first</option>
            ) : availableSections.length === 0 ? (
              <option value="">No sections configured for this grade</option>
            ) : (
              <>
                <option value="">Select a Section</option>
                {availableSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name} {section.displayName ? `(${section.displayName})` : ''}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
      </div>

      {/* 2. Status & Workflow Toolbar Ribbon (Stage 3.5) */}
      {selectedClassSectionId && scheduleStatus && (
        <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status & Indicators */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Badge */}
            {scheduleStatus === 'PUBLISHED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Live Published
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                Draft Timetable
              </span>
            )}

            {/* Published Timestamp */}
            {scheduleStatus === 'PUBLISHED' && (
              <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {formatPublishedDate(publishedAt)}
              </span>
            )}

            {/* Dirty State Indicator */}
            {isDirty && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  scheduleStatus === 'PUBLISHED'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {scheduleStatus === 'PUBLISHED'
                  ? 'Staged changes — not published'
                  : 'Unsaved changes'}
              </span>
            )}
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Discard Changes */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDiscardChanges}
              disabled={!isDirty || isSavingDraft || isPublishing}
              className="rounded-xl text-xs font-bold border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Discard Changes
            </Button>

            {/* Save Draft (Only for DRAFT schedules) */}
            {scheduleStatus === 'DRAFT' && (
              <Button
                type="button"
                size="sm"
                onClick={onSaveDraft}
                disabled={!isDirty || isSavingDraft || isPublishing}
                className="bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
              </Button>
            )}

            {/* Preview (Stage 3.7) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenPreview}
              disabled={isPublishing || isSavingDraft}
              className="rounded-xl text-xs font-bold border-blue-200 text-blue-900 hover:bg-blue-50/60 shadow-xs"
              title="Preview timetable and review staged changes"
              aria-label="Preview timetable and review staged changes"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5 text-blue-900" />
              Preview
            </Button>

            {/* Publish Changes (Stage 3.6) */}
            <Button
              type="button"
              size="sm"
              onClick={onPublish}
              disabled={!isDirty || isPublishing || isSavingDraft}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {isPublishing ? 'Publishing...' : 'Publish Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
