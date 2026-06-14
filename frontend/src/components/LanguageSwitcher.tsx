import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/themeStore';
import { LANGUAGES, getLanguageOption, type AppLanguage } from '../i18n/languages';
import FlagIcon from './FlagIcon';

const MENU_WIDTH = 176;

function useLanguageSwitch(onDone?: () => void) {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useThemeStore();

  const switchLanguage = (lang: AppLanguage) => {
    if (lang !== language) {
      setLanguage(lang);
      i18n.changeLanguage(lang);
    }
    onDone?.();
  };

  return { language, switchLanguage, current: getLanguageOption(language) };
}

interface LanguageMenuProps {
  language: AppLanguage;
  onSelect: (lang: AppLanguage) => void;
  className?: string;
}

function LanguageMenu({ language, onSelect, className = '' }: LanguageMenuProps) {
  return (
    <ul role="listbox" aria-label="Languages" className={`py-1 ${className}`}>
      {LANGUAGES.map((lang) => (
        <li key={lang.code} role="option" aria-selected={language === lang.code}>
          <button
            type="button"
            onClick={() => onSelect(lang.code)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition ${
              language === lang.code
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <FlagIcon country={lang.flag} className="w-5 h-3.5 rounded-sm shadow-sm flex-shrink-0" />
            <span className="flex-1 text-start truncate">{lang.nativeLabel}</span>
            <span className="text-xs text-gray-400 uppercase flex-shrink-0">{lang.code}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Inline language grid for mobile navigation drawer */
export function MobileLanguagePicker({ onSelect }: { onSelect?: () => void }) {
  const { t } = useTranslation();
  const { language, switchLanguage } = useLanguageSwitch(onSelect);

  return (
    <div className="mt-2 pt-3 border-t border-gray-200 dark:border-gray-700">
      <p className="px-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-start">
        {t('common.language')}
      </p>
      <div className="grid grid-cols-2 gap-1 px-2 pb-1">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => switchLanguage(lang.code)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition text-start ${
              language === lang.code
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700/80'
            }`}
          >
            <FlagIcon country={lang.flag} className="w-5 h-3.5 rounded-sm shadow-sm flex-shrink-0" />
            <span className="truncate">{lang.nativeLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Desktop dropdown language switcher */
export default function LanguageSwitcher() {
  const { language, switchLanguage, current } = useLanguageSwitch();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    let left = rect.right - MENU_WIDTH;

    // Keep menu inside viewport
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));

    setMenuPos({
      top: rect.bottom + 8,
      left,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        (target as Element).closest?.('[data-language-menu]')
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (lang: AppLanguage) => {
    switchLanguage(lang);
    setOpen(false);
  };

  const dropdown =
    open &&
    menuPos &&
    createPortal(
      <div
        data-language-menu
        className="fixed z-[200] w-44 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
        style={{ top: menuPos.top, left: menuPos.left }}
      >
        <LanguageMenu
          language={language}
          onSelect={handleSelect}
        />
      </div>,
      document.body
    );

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm font-medium text-gray-700 dark:text-gray-200"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.nativeLabel}`}
      >
        <FlagIcon country={current.flag} className="w-5 h-3.5 rounded-sm shadow-sm flex-shrink-0" />
        <span className="hidden lg:inline truncate max-w-[5rem]">{current.nativeLabel}</span>
        <span className="lg:hidden uppercase">{current.code}</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {dropdown}
    </div>
  );
}
