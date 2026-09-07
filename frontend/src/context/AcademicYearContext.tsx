import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAcademicYears, activateAcademicYear, AcademicYear } from '../api/academicStructure';
import { toast } from 'sonner';

interface AcademicYearContextType {
  academicYears: AcademicYear[];
  activeAcademicYear: AcademicYear | null;
  activeAcademicYearId: string;
  selectedAcademicYearId: string;
  setSelectedAcademicYearId: (id: string) => void;
  activateYear: (id: string) => Promise<void>;
  isActivating: boolean;
  isLoading: boolean;
  isError: boolean;
  refetchAcademicYears: () => Promise<any>;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export const AcademicYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const {
    data: academicYears = [],
    isLoading,
    isError,
    refetch: refetchAcademicYears,
  } = useQuery<AcademicYear[]>({
    queryKey: ['academicYears'],
    queryFn: async () => {
      const res = await getAcademicYears();
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const activeAcademicYear = useMemo(() => {
    return academicYears.find((y) => y.isCurrent) || academicYears[0] || null;
  }, [academicYears]);

  const activeAcademicYearId = activeAcademicYear?.id || '';

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');

  // Keep selectedAcademicYearId aligned with active year by default
  useEffect(() => {
    if (activeAcademicYearId && !selectedAcademicYearId) {
      setSelectedAcademicYearId(activeAcademicYearId);
    }
  }, [activeAcademicYearId, selectedAcademicYearId]);

  const activateMutation = useMutation({
    mutationFn: activateAcademicYear,
    onSuccess: (updatedYear, yearId) => {
      setSelectedAcademicYearId(yearId);

      // Invalidate all academic-year dependent query families
      queryClient.invalidateQueries({ queryKey: ['academicYears'] });
      queryClient.invalidateQueries({ queryKey: ['gradeLevels'] });
      queryClient.invalidateQueries({ queryKey: ['grade-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['adminSections'] });
      queryClient.invalidateQueries({ queryKey: ['adminSectionRoster'] });
      queryClient.invalidateQueries({ queryKey: ['adminSectionReportCards'] });
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      queryClient.invalidateQueries({ queryKey: ['reportCardTerms'] });
      queryClient.invalidateQueries({ queryKey: ['teachers', 'me', 'homeroom-context'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'class-sections'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'stats'] });

      toast.success(`Academic Year ${updatedYear?.year || ''} activated successfully`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to activate academic year');
    },
  });

  const activateYear = useCallback(
    async (id: string) => {
      await activateMutation.mutateAsync(id);
    },
    [activateMutation],
  );

  return (
    <AcademicYearContext.Provider
      value={{
        academicYears,
        activeAcademicYear,
        activeAcademicYearId,
        selectedAcademicYearId: selectedAcademicYearId || activeAcademicYearId,
        setSelectedAcademicYearId,
        activateYear,
        isActivating: activateMutation.isPending,
        isLoading,
        isError,
        refetchAcademicYears,
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYear = () => {
  const context = useContext(AcademicYearContext);
  if (!context) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider');
  }
  return context;
};
