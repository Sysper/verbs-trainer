import raw from '../data/verbs.json';
import type { EdSound, Filter, Verb } from '../types';

export const VERBS = raw as Verb[];

export const ED_LABELS: Record<EdSound, string> = {
  t: '📢 Regular verb: the <b>-ed</b> here sounds like <b>/t/</b> — one quick sound, no extra syllable ("uérkt", not "uérked").',
  d: '📢 Regular verb: the <b>-ed</b> here sounds like <b>/d/</b> — soft, no extra syllable ("pléid", not "pléyed").',
  id: '📢 Regular verb: after <b>t</b> or <b>d</b>, the <b>-ed</b> adds a syllable and sounds like <b>/id/</b> ("uón-tid").',
};

/** A verb's stable identity across sessions — used as the localStorage key. */
export const verbId = (v: Verb): string => v.base;

export function pool(filter: Filter): Verb[] {
  return filter === 'all' ? VERBS : VERBS.filter((v) => v.type === filter);
}

/** Fisher–Yates, on a copy — the caller's array is never touched. */
export function shuffle<T>(input: readonly T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** "got/gotten" → "got". The form we speak out loud. */
export function firstForm(s: string): string {
  return s.split('/')[0].trim();
}

export function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Any of the accepted alternatives counts as correct. */
export function matches(input: string, answer: string): boolean {
  return answer.split('/').map(norm).includes(norm(input)) || norm(input) === norm(answer);
}
