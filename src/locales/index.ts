/**
 * Locales index file
 * Exports all language translations
 */

import { en } from "./en";
import { zh } from "./zh";
import { es } from "./es";

export interface LanguageConfig {
  languageInstructions: string;
  jsonExample: string;
  errorMessages: {
    noResults: string;
    tryDifferentKeywords: string;
    thankYou: string;
  };
}

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES = {
  ZH: "zh",
  ES: "es",
  EN: "en",
} as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[keyof typeof SUPPORTED_LANGUAGES];

/**
 * All language translations
 */
export const translations: Record<SupportedLanguage, LanguageConfig> = {
  [SUPPORTED_LANGUAGES.EN]: en,
  [SUPPORTED_LANGUAGES.ZH]: zh,
  [SUPPORTED_LANGUAGES.ES]: es,
};

/**
 * Get language configuration
 */
export function getLanguageConfig(language: string): LanguageConfig {
  const lang = language as SupportedLanguage;
  return translations[lang] || translations[SUPPORTED_LANGUAGES.EN];
}

/**
 * Get language instructions
 */
export function getLanguageInstructions(language: string): string {
  const lang = language as SupportedLanguage;
  return translations[lang]?.languageInstructions || translations[SUPPORTED_LANGUAGES.EN].languageInstructions;
}

/**
 * Get JSON example
 */
export function getJSONExample(language: string): string {
  const lang = language as SupportedLanguage;
  return translations[lang]?.jsonExample || translations[SUPPORTED_LANGUAGES.EN].jsonExample;
}

/**
 * Get error messages
 */
export function getErrorMessages(language: string) {
  const lang = language as SupportedLanguage;
  return translations[lang]?.errorMessages || translations[SUPPORTED_LANGUAGES.EN].errorMessages;
}

/**
 * Check if language is supported
 */
export function isSupportedLanguage(language: string): language is SupportedLanguage {
  return Object.values(SUPPORTED_LANGUAGES).includes(language as SupportedLanguage);
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): SupportedLanguage[] {
  return Object.values(SUPPORTED_LANGUAGES);
}

// Export individual language modules
export { en, zh, es };
