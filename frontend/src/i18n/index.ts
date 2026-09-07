import enCommon from './locales/en/common.json';
import enParent from './locales/en/parent.json';
import amCommon from './locales/am/common.json';
import amParent from './locales/am/parent.json';
import omCommon from './locales/om/common.json';
import omParent from './locales/om/parent.json';

export type SupportedLanguage = 'en' | 'am' | 'om';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'am', 'om'];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
export const LANGUAGE_STORAGE_KEY = 'school_portal_language';

export const translations = {
  en: {
    common: enCommon,
    parent: enParent,
  },
  am: {
    common: amCommon,
    parent: amParent,
  },
  om: {
    common: omCommon,
    parent: omParent,
  },
};

function getNestedValue(obj: unknown, path: string): string | null {
  if (!obj || typeof obj !== 'object') return null;
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return null;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : null;
}

export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params || !template) return template || '';
  return template.replace(/\{\{\s*(\w+)\s*\}\}|\{\s*(\w+)\s*\}/g, (match, p1, p2) => {
    const key = p1 || p2;
    if (key in params && params[key] !== undefined && params[key] !== null) {
      return String(params[key]);
    }
    return match;
  });
}

export function translate(
  lang: SupportedLanguage,
  path: string,
  params?: Record<string, string | number>
): string {
  // 1. Try resolving in target language
  const targetDict = translations[lang] || translations[DEFAULT_LANGUAGE];
  let raw = getNestedValue(targetDict, path);

  // 2. Fall back to English if missing in target language
  if (!raw && lang !== DEFAULT_LANGUAGE) {
    raw = getNestedValue(translations[DEFAULT_LANGUAGE], path);
  }

  // 3. Fallback to path key if still not found
  if (!raw) {
    return path;
  }

  // 4. Interpolate variables
  return interpolate(raw, params);
}
