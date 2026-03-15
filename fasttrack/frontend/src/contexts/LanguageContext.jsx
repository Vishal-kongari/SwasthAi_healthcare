import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, languages } from '../i18n/translations';

const STORAGE_KEY = 'swasthai_lang';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored && translations[stored] ? stored : null;
    } catch {
      return null;
    }
  });

  const setLanguage = useCallback((code) => {
    if (!translations[code]) return;
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      console.warn('Could not persist language', e);
    }
  }, []);

  useEffect(() => {
    if (!language && typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && translations[stored]) setLanguageState(stored);
    }
  }, [language]);

  const t = useCallback(
    (key) => {
      const lang = language || 'en';
      const dict = translations[lang] || translations.en;
      const value = dict[key];
      return value !== undefined ? value : (translations.en[key] || key);
    },
    [language]
  );

  const value = {
    language: language || 'en',
    languageNotChosen: language === null,
    setLanguage,
    t,
    languages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
