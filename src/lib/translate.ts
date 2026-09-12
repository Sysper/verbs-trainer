import type { Direction, DirMode, Verb } from '../types';
import { norm, VERBS } from './verbs';

const looksSpanish = (w: string): boolean =>
  /[áéíóúñ¿¡]/.test(w) || /(ar|er|ir|arse|erse|irse)$/.test(w.toLowerCase());

export function resolveDir(word: string, mode: DirMode): Direction {
  if (mode !== 'auto') return mode;
  return looksSpanish(word) ? 'es-en' : 'en-es';
}

export const dirLabel = (d: Direction): string =>
  d === 'es-en' ? 'Spanish → English' : 'English → Spanish';

/** Look up a local verb first — instant, no internet needed. */
export function localHit(word: string, dir: Direction): Verb | null {
  const n = norm(word);
  for (const v of VERBS) {
    if (dir === 'en-es') {
      const forms = [v.base, ...v.past.split('/'), ...v.part.split('/')];
      if (forms.some((x) => norm(x) === n)) return v;
    } else if (v.es.split('/').some((x) => norm(x) === n) || norm(v.es) === n) {
      return v;
    }
  }
  return null;
}

export interface Dict {
  id: string;
  name: string;
  icon: string;
  tip: string;
  url: (w: string, d: Direction) => string;
}

/** Dictionary sites — all free, open in a new tab, no API and no account needed. */
export const DICTS: Dict[] = [
  {
    id: 'wr',
    name: 'WordReference',
    icon: '📖',
    tip: 'Best for verbs: every meaning, plus forum discussions',
    url: (w, d) =>
      d === 'es-en'
        ? `https://www.wordreference.com/es/en/translation.asp?spen=${encodeURIComponent(w)}`
        : `https://www.wordreference.com/es/translation.asp?tranword=${encodeURIComponent(w)}`,
  },
  {
    id: 'deepl',
    name: 'DeepL',
    icon: '🎯',
    tip: 'The most natural translations, great for full sentences',
    url: (w, d) =>
      `https://www.deepl.com/translator#${d === 'es-en' ? 'es/en' : 'en/es'}/${encodeURIComponent(w)}`,
  },
  {
    id: 'gt',
    name: 'Google Translate',
    icon: '🌍',
    tip: 'Fastest, and handles any language',
    url: (w, d) =>
      `https://translate.google.com/?sl=${d === 'es-en' ? 'es' : 'en'}&tl=${d === 'es-en' ? 'en' : 'es'}&text=${encodeURIComponent(w)}`,
  },
  {
    id: 'cam',
    name: 'Cambridge',
    icon: '🎓',
    tip: 'Includes real IPA phonetics and audio',
    url: (w, d) =>
      `https://dictionary.cambridge.org/dictionary/${d === 'es-en' ? 'spanish-english' : 'english-spanish'}/${encodeURIComponent(w)}`,
  },
  {
    id: 'lin',
    name: 'Linguee',
    icon: '🔍',
    tip: 'Shows the word used in real bilingual sentences',
    url: (w) => `https://www.linguee.com/english-spanish/search?query=${encodeURIComponent(w)}`,
  },
];
