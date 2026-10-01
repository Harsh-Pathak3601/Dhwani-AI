import { useCallback } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { SUPPORTED_LANGUAGES, TRANSLATIONS, LanguageOption } from './translations';

export const useTranslation = () => {
  const speechLanguage = useSessionStore((state) => state.speechLanguage);
  const setSpeechLanguage = useSessionStore((state) => state.setSpeechLanguage);

  // Normalize language key: if not found, fallback to 'en-IN' or 'hi-IN'
  const activeLang = TRANSLATIONS[speechLanguage] ? speechLanguage : 'en-IN';

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const dict = TRANSLATIONS[activeLang] || TRANSLATIONS['en-IN'];
      if (dict && dict[key]) {
        return dict[key];
      }
      // Fallback to English if translation key is missing in active language
      const englishDict = TRANSLATIONS['en-IN'];
      if (englishDict && englishDict[key]) {
        return englishDict[key];
      }
      return fallback || key;
    },
    [activeLang]
  );

  const currentOption = SUPPORTED_LANGUAGES.find((l) => l.code === activeLang) || SUPPORTED_LANGUAGES[0];

  const setLanguage = useCallback(
    (code: string) => {
      setSpeechLanguage(code);
    },
    [setSpeechLanguage]
  );

  return {
    t,
    currentLang: activeLang,
    currentLanguageOption: currentOption,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
};

export { SUPPORTED_LANGUAGES, TRANSLATIONS };
export type { LanguageOption };
