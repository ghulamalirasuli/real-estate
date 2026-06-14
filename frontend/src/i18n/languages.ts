export type AppLanguage = 'en' | 'fa' | 'ar' | 'de';

export type FlagCountry = 'gb' | 'ir' | 'sa' | 'de';

export interface LanguageOption {
  code: AppLanguage;
  label: string;
  nativeLabel: string;
  flag: FlagCountry;
  rtl: boolean;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: 'gb', rtl: false },
  { code: 'fa', label: 'Farsi', nativeLabel: 'فارسی', flag: 'ir', rtl: true },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: 'sa', rtl: true },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: 'de', rtl: false },
];

const RTL_CODES = new Set<AppLanguage>(LANGUAGES.filter((l) => l.rtl).map((l) => l.code));

export function isRtlLanguage(lang: AppLanguage): boolean {
  return RTL_CODES.has(lang);
}

export function isAppLanguage(value: string | null): value is AppLanguage {
  return LANGUAGES.some((l) => l.code === value);
}

export function getLanguageOption(code: AppLanguage): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
