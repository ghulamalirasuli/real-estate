import { create } from 'zustand';
import { type AppLanguage, isAppLanguage, isRtlLanguage } from '../i18n/languages';

interface ThemeState {
  darkMode: boolean;
  language: AppLanguage;
  toggleDarkMode: () => void;
  setLanguage: (lang: AppLanguage) => void;
}

const savedLang = localStorage.getItem('language');
const initialLanguage: AppLanguage = isAppLanguage(savedLang) ? savedLang : 'en';

export const useThemeStore = create<ThemeState>((set) => ({
  darkMode: localStorage.getItem('darkMode') === 'true',
  language: initialLanguage,

  toggleDarkMode: () => {
    set((state) => {
      const newDarkMode = !state.darkMode;
      localStorage.setItem('darkMode', String(newDarkMode));
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { darkMode: newDarkMode };
    });
  },

  setLanguage: (lang) => {
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtlLanguage(lang) ? 'rtl' : 'ltr';
    set({ language: lang });
  },
}));
