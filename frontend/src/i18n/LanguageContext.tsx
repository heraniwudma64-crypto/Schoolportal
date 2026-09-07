import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  translate,
} from './index';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && (SUPPORTED_LANGUAGES as string[]).includes(saved)) {
      return saved as SupportedLanguage;
    }
  } catch (e) {
    console.warn('[i18n] Failed to read from localStorage:', e);
  }
  return DEFAULT_LANGUAGE;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      setLanguageState(lang);
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      } catch (e) {
        console.warn('[i18n] Failed to write to localStorage:', e);
      }
      document.documentElement.lang = lang;
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Sync across tabs via window storage event
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LANGUAGE_STORAGE_KEY && event.newValue) {
        if ((SUPPORTED_LANGUAGES as string[]).includes(event.newValue)) {
          setLanguageState(event.newValue as SupportedLanguage);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      return translate(language, path, params);
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
