import React, { useState, useRef, useEffect } from 'react';
import { useParent } from '../../context/ParentContext';
import { GraduationCap, ChevronDown, Check, Users, Sparkles } from 'lucide-react';

interface ChildSelectorProps {
  className?: string;
  variant?: 'header' | 'card';
}

export const ChildSelector: React.FC<ChildSelectorProps> = ({ className = '', variant = 'header' }) => {
  const { childrenList, selectedChild, selectedChildId, setSelectedChildId, isLoading } = useParent();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-gray-100/80 rounded-xl animate-pulse text-xs text-gray-500 font-medium ${className}`}>
        <div className="w-4 h-4 bg-gray-300 rounded-full" />
        <span>Loading students...</span>
      </div>
    );
  }

  // Case 0: No linked children
  if (childrenList.length === 0) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700 ${className}`}>
        <Users className="w-4 h-4 text-amber-600" />
        <span>No Linked Students</span>
      </div>
    );
  }

  // Case 1: Exactly 1 child (Clean, non-confusing badge)
  if (childrenList.length === 1) {
    const child = childrenList[0];
    const sectionInfo = child.classSection?.name || child.currentEnrollment?.classSection || 'Enrolled';
    const gradeInfo = child.classSection?.gradeLevel || child.currentEnrollment?.gradeLevel || '';

    return (
      <div className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-blue-50/80 border border-blue-100 rounded-xl text-xs ${className}`}>
        <div className="w-6 h-6 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
          {child.firstName.charAt(0)}
        </div>
        <div className="flex flex-col text-left">
          <span className="font-bold text-gray-900 leading-none">{child.fullName}</span>
          <span className="text-[10px] text-blue-700 font-medium leading-tight mt-0.5">
            {gradeInfo ? `${gradeInfo} • ` : ''}{sectionInfo}
          </span>
        </div>
      </div>
    );
  }

  // Case 2: Multiple children (Interactive selector dropdown)
  const current = selectedChild || childrenList[0];
  const sectionText = current.classSection?.name || current.currentEnrollment?.classSection || 'Enrolled';
  const gradeText = current.classSection?.gradeLevel || current.currentEnrollment?.gradeLevel || '';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-3 px-3.5 py-1.5 bg-white hover:bg-blue-50/60 border border-gray-200 hover:border-blue-300 rounded-xl shadow-xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-600/20 group"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-900 to-blue-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
          {current.firstName.charAt(0)}
        </div>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-900 group-hover:text-blue-900 transition-colors">
              {current.fullName}
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.2 rounded-md">
              {sectionText}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 font-medium leading-none">
            {gradeText ? `${gradeText} • ` : ''}Adm: {current.admissionNo}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 group-hover:text-blue-900 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-900' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              Select Student
            </span>
            <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-1.5 py-0.5 rounded-full">
              {childrenList.length} Students
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {childrenList.map((child) => {
              const isSelected = child.id === selectedChildId;
              const childSection = child.classSection?.name || child.currentEnrollment?.classSection || 'Enrolled';
              const childGrade = child.classSection?.gradeLevel || child.currentEnrollment?.gradeLevel || '';

              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => {
                    setSelectedChildId(child.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-blue-50/80 text-blue-950 font-medium' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-blue-900 text-white shadow-xs' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {child.firstName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-900">{child.fullName}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                        {childGrade && <span>{childGrade}</span>}
                        {childGrade && <span>•</span>}
                        <span className="font-semibold text-blue-700">{childSection}</span>
                        <span>•</span>
                        <span>{child.admissionNo}</span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildSelector;
