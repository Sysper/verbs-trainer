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

/** Edit distance, used to rank how confusable two forms look. */
function distance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = current;
    }
  }
  return prev[b.length];
}

/**
 * The "-ed" form a learner reaches for when they forget a verb is irregular:
 * telled, goed, buyed. For a regular verb this is usually its real past, so
 * the caller drops it as a duplicate.
 */
function regularize(base: string): string {
  if (base.endsWith('e')) return `${base}d`;
  if (/[^aeiou]y$/.test(base)) return `${base.slice(0, -1)}ied`;
  return `${base}ed`;
}

/** Naive "-ed" that ignores the y→ied and doubling rules: studyed, stoped. */
function naiveEd(base: string): string {
  return base.endsWith('e') ? `${base}d` : `${base}ed`;
}

/**
 * Builds the answer choices for one form of a verb.
 *
 * Distractors are wrong on purpose but never arbitrary — a random form from
 * another verb teaches nothing, because it is discarded on sight. Two sources,
 * in order of teaching value:
 *
 * 1. The mistakes learners actually make with THIS verb: the other principal
 *    part (the "I have went" confusion), the regularised form (telled), the
 *    bare base, and the naive -ed spelling for regular verbs (studyed). These
 *    are forms of the verb being asked, so they always belong.
 * 2. Forms of other verbs, restricted to those starting with the same letter
 *    as the answer and then ranked by edit distance, so the four options read
 *    as a set instead of one plausible word among strangers.
 *
 * The initial is matched against the ANSWER, not the base form. They are the
 * same in 273 of 276 cases; in the other three (go→went, be→was, eat→ate)
 * matching the base would leave the answer as the only word with a different
 * initial, which hands it over.
 *
 * Only two of the first kind are used per question, picked at random, so the
 * same verb does not always offer the same four options.
 */
export function buildOptions(verb: Verb, field: 'past' | 'part', count = 4): string[] {
  const correct = verb[field];
  const seen = new Set([norm(correct)]);
  const chosen: string[] = [];

  const add = (option: string): boolean => {
    if (chosen.length >= count - 1) return false;
    const key = norm(option);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    chosen.push(option);
    return true;
  };

  // 1. Plausible mistakes for this particular verb.
  const confusions = shuffle(
    [
      field === 'past' ? verb.part : verb.past,
      regularize(verb.base),
      naiveEd(verb.base),
      verb.base,
    ].filter((o) => norm(o) !== norm(correct)),
  );
  for (const option of confusions.slice(0, 2)) add(option);

  // 2. Forms of other verbs, same initial as the answer, closest first.
  const target = firstForm(correct);
  const initial = target[0]?.toLowerCase() ?? '';
  const neighbours = (candidates: readonly Verb[], matchInitial: boolean) =>
    candidates
      .filter((v) => v.base !== verb.base && !seen.has(norm(v[field])))
      .filter((v) => !matchInitial || firstForm(v[field])[0]?.toLowerCase() === initial)
      .map((v) => ({ option: v[field], d: distance(target, firstForm(v[field])) }))
      .sort((a, b) => a.d - b.d);

  // Shuffling the closest handful keeps the question varied without letting an
  // obviously unrelated word in.
  const sameType = neighbours(VERBS.filter((v) => v.type === verb.type), true);
  for (const { option } of shuffle(sameType.slice(0, 6))) add(option);
  if (chosen.length < count - 1) {
    for (const { option } of neighbours(VERBS, true)) add(option);
  }
  // Some initials simply have too few verbs (q has none besides quit itself).
  // Four options that read as a set beats three that match a rule.
  if (chosen.length < count - 1) {
    for (const { option } of neighbours(VERBS, false)) add(option);
  }

  return shuffle([correct, ...chosen]);
}
