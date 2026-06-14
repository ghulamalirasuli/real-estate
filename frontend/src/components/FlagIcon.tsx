import type { FlagCountry } from '../i18n/languages';

interface FlagIconProps {
  country: FlagCountry;
  className?: string;
}

export default function FlagIcon({ country, className = 'w-5 h-3.5' }: FlagIconProps) {
  if (country === 'ir') {
    return (
      <svg className={className} viewBox="0 0 640 480" aria-hidden="true">
        <rect width="640" height="160" fill="#239f40" />
        <rect y="160" width="640" height="160" fill="#fff" />
        <rect y="320" width="640" height="160" fill="#da0000" />
        <g transform="translate(320 240)">
          <circle r="52" fill="#da0000" />
          <circle r="42" fill="#fff" />
          <circle r="32" fill="#da0000" />
        </g>
      </svg>
    );
  }

  if (country === 'de') {
    return (
      <svg className={className} viewBox="0 0 640 480" aria-hidden="true">
        <rect width="640" height="160" fill="#000" />
        <rect y="160" width="640" height="160" fill="#D00" />
        <rect y="320" width="640" height="160" fill="#FFCE00" />
      </svg>
    );
  }

  if (country === 'sa') {
    return (
      <svg className={className} viewBox="0 0 640 480" aria-hidden="true">
        <rect width="640" height="480" fill="#006C35" />
        <rect x="120" y="180" width="400" height="120" rx="4" fill="#fff" opacity="0.9" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 640 480" aria-hidden="true">
      <rect width="640" height="480" fill="#012169" />
      <path fill="#fff" d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z" />
      <path fill="#C8102E" d="M424 281l216 159v40L369 281h55zm-216 0L0 441v-40l216-159h8zM640 0v46L432 0h208zM0 0l240 46H0V0z" />
      <path fill="#fff" d="M241 0v480h158V0H241zM0 160v160h640V160H0z" />
      <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h94V0h-94z" />
    </svg>
  );
}
