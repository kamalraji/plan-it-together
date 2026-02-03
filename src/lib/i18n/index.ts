/**
 * i18n Configuration
 * Internationalization setup using react-i18next
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' },
  // Add more languages here as needed:
  // { code: 'es', name: 'Español', dir: 'ltr' },
  // { code: 'ar', name: 'العربية', dir: 'rtl' },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

// Get browser language or default
const getDefaultLanguage = (): SupportedLanguage => {
  const browserLang = navigator.language.split('-')[0];
  const supported = SUPPORTED_LANGUAGES.find(l => l.code === browserLang);
  return supported?.code || 'en';
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    lng: getDefaultLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Namespace configuration
    defaultNS: 'translation',
    // Debug in development
    debug: import.meta.env.DEV,
  });

export default i18n;

// Re-export for convenience
export { useTranslation } from 'react-i18next';
