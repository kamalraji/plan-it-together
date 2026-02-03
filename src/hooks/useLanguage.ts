/**
 * useLanguage - Hook for managing language preferences
 */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/lib/i18n';

const LANGUAGE_STORAGE_KEY = 'preferred-language';

export function useLanguage() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    (localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage) || 'en'
  );

  // Get language direction for RTL support
  const currentDir = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)?.dir || 'ltr';

  // Change language
  const changeLanguage = useCallback(async (lang: SupportedLanguage) => {
    await i18n.changeLanguage(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    setCurrentLanguage(lang);
    
    // Update document direction for RTL languages
    const dir = SUPPORTED_LANGUAGES.find(l => l.code === lang)?.dir || 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [i18n]);

  // Initialize on mount
  useEffect(() => {
    const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage;
    if (savedLang && i18n.language !== savedLang) {
      changeLanguage(savedLang);
    } else {
      // Set initial direction
      document.documentElement.dir = currentDir;
      document.documentElement.lang = currentLanguage;
    }
  }, [changeLanguage, currentDir, currentLanguage, i18n.language]);

  return {
    currentLanguage,
    currentDir,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    t: i18n.t,
  };
}
