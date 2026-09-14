import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../localization/language_context';
import { Language } from '../localization/types';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="px-2 text-slate-400 dark:text-slate-500">
        <Globe className="w-4 h-4" />
      </div>
      <button
        id="lang-en-btn"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
          language === 'en'
            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        id="lang-hi-btn"
        onClick={() => setLanguage('hi')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
          language === 'hi'
            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        हिंदी
      </button>
    </div>
  );
}
