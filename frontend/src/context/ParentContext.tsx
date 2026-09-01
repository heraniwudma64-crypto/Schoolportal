import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getChildren, ParentChildSummary } from '../api/parents';
import { useAuth } from './AuthContext';

interface ParentContextType {
  childrenList: ParentChildSummary[];
  selectedChildId: string | null;
  selectedChild: ParentChildSummary | null;
  isLoading: boolean;
  error: string | null;
  setSelectedChildId: (id: string) => void;
  refetchChildren: () => Promise<void>;
}

const ParentContext = createContext<ParentContextType | undefined>(undefined);

const SELECTED_CHILD_KEY = 'school_portal_parent_selected_child';

export const ParentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [childrenList, setChildrenList] = useState<ParentChildSummary[]>([]);
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isParent = user?.role === 'parent';

  const fetchChildrenList = useCallback(async () => {
    if (!isParent || !token) {
      setChildrenList([]);
      setSelectedChildIdState(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getChildren();
      const list = Array.isArray(data) ? data : [];
      setChildrenList(list);

      if (list.length > 0) {
        const savedChildId = localStorage.getItem(SELECTED_CHILD_KEY);
        const childExists = savedChildId && list.some((c) => c.id === savedChildId);

        if (childExists && savedChildId) {
          setSelectedChildIdState(savedChildId);
        } else {
          // Auto-select first child
          const firstChildId = list[0].id;
          setSelectedChildIdState(firstChildId);
          localStorage.setItem(SELECTED_CHILD_KEY, firstChildId);
        }
      } else {
        setSelectedChildIdState(null);
        localStorage.removeItem(SELECTED_CHILD_KEY);
      }
    } catch (err: any) {
      console.error('Failed to load parent children:', err);
      setError(err?.message || 'Failed to load children records.');
      setChildrenList([]);
      setSelectedChildIdState(null);
    } finally {
      setIsLoading(false);
    }
  }, [isParent, token]);

  useEffect(() => {
    void fetchChildrenList();
  }, [fetchChildrenList]);

  const setSelectedChildId = useCallback((id: string) => {
    setSelectedChildIdState(id);
    localStorage.setItem(SELECTED_CHILD_KEY, id);
  }, []);

  const selectedChild = useMemo(() => {
    if (!selectedChildId || childrenList.length === 0) return null;
    return childrenList.find((c) => c.id === selectedChildId) || null;
  }, [selectedChildId, childrenList]);

  return (
    <ParentContext.Provider
      value={{
        childrenList,
        selectedChildId,
        selectedChild,
        isLoading,
        error,
        setSelectedChildId,
        refetchChildren: fetchChildrenList,
      }}
    >
      {children}
    </ParentContext.Provider>
  );
};

export const useParent = () => {
  const context = useContext(ParentContext);
  if (context === undefined) {
    throw new Error('useParent must be used within a ParentProvider');
  }
  return context;
};
