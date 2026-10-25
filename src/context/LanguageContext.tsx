
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

import {
  translations,
  type Language,
  type TranslationKey,
} from '../i18n/translations';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<
  LanguageContextValue | undefined
>(undefined);

const STORAGE_KEY = 'doodhdrishti-language';

function getSavedLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === 'en' || saved === 'hi' || saved === 'kn') {
      return saved;
    }
  } catch {
    // Use English if browser storage is unavailable.
  }

  // Support the language key used by the earlier Settings page.
  try {
    const previous = localStorage.getItem('dd_lang');

    if (previous === 'en' || previous === 'hi' || previous === 'kn') {
      return previous;
    }
  } catch {
    // Continue with English.
  }

  return 'en';
}

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] =
    useState<Language>(getSavedLanguage);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);

    try {
      localStorage.setItem(STORAGE_KEY, nextLanguage);
      localStorage.setItem('dd_lang', nextLanguage);
    } catch {
      // The selection still applies during the current session.
    }
  }

  function t(key: TranslationKey): string {
    return translations[language][key] ?? translations.en[key];
  }

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider',
    );
  }

  return context;
}
