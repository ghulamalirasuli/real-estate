import { LANGUAGES, type AppLanguage } from '../i18n/languages';

export type Translations = Record<string, string>;

/** Languages used for user-generated content (properties, plans, etc.) */
export const CONTENT_LANGUAGES = LANGUAGES;
export const DEFAULT_CONTENT_LANGUAGE: AppLanguage = 'en';

export function emptyTranslations(): Translations {
  return Object.fromEntries(CONTENT_LANGUAGES.map((l) => [l.code, '']));
}

export function fromTranslations(source?: Translations | null): Translations {
  const result = emptyTranslations();
  if (!source) return result;
  for (const lang of CONTENT_LANGUAGES) {
    if (source[lang.code]) {
      result[lang.code] = source[lang.code];
    }
  }
  return result;
}

export function getLocalizedText(
  source: Translations | undefined | null,
  language: string,
  fallback: string = DEFAULT_CONTENT_LANGUAGE
): string {
  if (!source) return '';
  return source[language] || source[fallback] || Object.values(source).find(Boolean) || '';
}

export function appendTranslationsToFormData(
  formData: FormData,
  field: string,
  translations: Translations,
  requiredLang: string = DEFAULT_CONTENT_LANGUAGE
): void {
  for (const lang of CONTENT_LANGUAGES) {
    const value = translations[lang.code]?.trim();
    if (value) {
      formData.append(`${field}[${lang.code}]`, value);
    } else if (lang.code === requiredLang) {
      formData.append(`${field}[${lang.code}]`, '');
    }
  }
}

export function hasRequiredTranslation(translations: Translations, requiredLang: string = DEFAULT_CONTENT_LANGUAGE): boolean {
  return Boolean(translations[requiredLang]?.trim());
}
