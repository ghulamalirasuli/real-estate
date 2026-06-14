import FlagIcon from './FlagIcon';
import { CONTENT_LANGUAGES, DEFAULT_CONTENT_LANGUAGE } from '../utils/translatable';
import type { Translations } from '../utils/translatable';

interface TranslatableFieldProps {
  label: string;
  value: Translations;
  onChange: (value: Translations) => void;
  multiline?: boolean;
  required?: boolean;
  rows?: number;
}

export default function TranslatableField({
  label,
  value,
  onChange,
  multiline = false,
  required = false,
  rows = 3,
}: TranslatableFieldProps) {
  const handleChange = (code: string, text: string) => {
    onChange({ ...value, [code]: text });
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </p>
      <div className="grid grid-cols-1 gap-3">
        {CONTENT_LANGUAGES.map((lang) => {
          const isRequired = required && lang.code === DEFAULT_CONTENT_LANGUAGE;
          const isRtl = lang.rtl;

          return (
            <div key={lang.code} className="relative">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                <FlagIcon country={lang.flag} className="w-4 h-3 rounded-sm" />
                <span>{lang.nativeLabel}</span>
                <span className="uppercase text-gray-400">({lang.code})</span>
                {isRequired && <span className="text-red-500">*</span>}
              </label>
              {multiline ? (
                <textarea
                  value={value[lang.code] || ''}
                  onChange={(e) => handleChange(lang.code, e.target.value)}
                  required={isRequired}
                  rows={rows}
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className={`${inputClass} resize-none`}
                  placeholder={`${label} (${lang.nativeLabel})`}
                />
              ) : (
                <input
                  type="text"
                  value={value[lang.code] || ''}
                  onChange={(e) => handleChange(lang.code, e.target.value)}
                  required={isRequired}
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className={inputClass}
                  placeholder={`${label} (${lang.nativeLabel})`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
