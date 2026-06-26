import React, { createContext, useContext, useState } from 'react';
import type { Language } from '../types';

interface LangContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (en: string, tc: string) => string;
}

const LangContext = createContext<LangContextType | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('mt_lang') as Language) ?? 'en';
  });

  function changeLang(l: Language) {
    setLang(l);
    localStorage.setItem('mt_lang', l);
  }

  function t(en: string, tc: string) {
    return lang === 'tc' ? tc : en;
  }

  return (
    <LangContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
