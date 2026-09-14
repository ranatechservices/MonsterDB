import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Translations } from './types';
import { en } from './translations/en';
import { hi } from './translations/hi';

interface LanguageContextType {
  language: Language;
  translations: Translations;
  t: Translations;
  setLanguage: (lang: Language) => void;
}

const translationsMap: Record<Language, Translations> = {
  en,
  hi,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('dhealora_language');
    return (saved === 'hi' || saved === 'en') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('dhealora_language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = translationsMap[language] || en;

  return (
    <LanguageContext.Provider value={{ language, translations: t, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
