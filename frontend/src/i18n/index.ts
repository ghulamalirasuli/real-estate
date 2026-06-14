import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import fa from './fa.json';
import ar from './ar.json';
import de from './de.json';
import { isAppLanguage } from './languages';

const savedLanguage = localStorage.getItem('language');
const lng = isAppLanguage(savedLanguage) ? savedLanguage : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fa: { translation: fa },
    ar: { translation: ar },
    de: { translation: de },
  },
  lng,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
