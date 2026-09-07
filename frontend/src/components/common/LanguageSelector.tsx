import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { SupportedLanguage } from '../../i18n';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface LanguageSelectorProps {
  className?: string;
}

const LANGUAGES: Array<{ code: SupportedLanguage; label: string; nativeLabel: string }> = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'am', label: 'Amharic', nativeLabel: 'አማርኛ' },
  { code: 'om', label: 'Afaan Oromoo', nativeLabel: 'Afaan Oromoo' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Sync highlightedIndex with currently selected language when opening
  useEffect(() => {
    if (isOpen) {
      const idx = LANGUAGES.findIndex((l) => l.code === language);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, language]);

  // Close dropdown on click outside or keyboard navigation
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % LANGUAGES.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + LANGUAGES.length) % LANGUAGES.length);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const selected = LANGUAGES[highlightedIndex];
        if (selected) {
          setLanguage(selected.code);
          setIsOpen(false);
          triggerRef.current?.focus();
        }
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
  }, [isOpen, highlightedIndex, setLanguage]);

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      if (!isOpen) {
        event.preventDefault();
        setIsOpen(true);
      }
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl shadow-xs transition-all duration-150 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('common.language.selectLanguage')}
      >
        <Globe className="w-4 h-4 text-blue-900" />
        <span className="font-bold text-gray-800">{current.nativeLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-900' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t('common.language.selectLanguage')}
          className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {LANGUAGES.map((lang, index) => {
            const isSelected = lang.code === language;
            const isHighlighted = index === highlightedIndex;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full text-left px-3.5 py-2 flex items-center justify-between text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-950 font-bold'
                    : isHighlighted
                    ? 'bg-gray-50 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{lang.nativeLabel}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
