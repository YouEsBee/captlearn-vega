import {Lang} from '../learning/types';

export interface LanguageOption {
  code: Lang;
  label: string;
  /** Only languages with vocabulary in the lexicon can be learnt. */
  available: boolean;
}

export const LANGUAGES: LanguageOption[] = [
  {code: 'zh', label: 'Chinese', available: true},
  // {code: 'ja', label: 'Japanese', available: false},
  // {code: 'ko', label: 'Korean', available: false},
  // {code: 'es', label: 'Spanish', available: false},
  // {code: 'vi', label: 'Vietnamese', available: false},
];

export const languageLabel = (code: Lang): string =>
  LANGUAGES.find(l => l.code === code)?.label ?? code;
