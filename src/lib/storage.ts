/**
 * Everything that survives a reload lives here.
 *
 * Storage is localStorage, so it is per-browser and per-device: it never
 * leaves the machine and it is not synced anywhere. Every access is wrapped
 * because localStorage throws in private mode and when site data is blocked.
 */

const PREFIX = 'vt.';
export const PROGRESS_KEY = `${PREFIX}progress`;
export const THEME_KEY = `${PREFIX}theme`;
export const SESSION_KEY = `${PREFIX}session`;
export const MODE_KEY = `${PREFIX}mode`;

export function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded or storage blocked — the app keeps working in memory */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/* ── progress ────────────────────────────────────────────────── */

/** Per-verb tally. `bad` is what drives the "verbs to review" list. */
export interface VerbStat {
  seen: number;
  ok: number;
  bad: number;
  /** Epoch ms of the last answer for this verb. */
  last: number;
}

export interface Progress {
  /** Bumped when the shape changes, so old data can be discarded safely. */
  version: 1;
  ok: number;
  bad: number;
  streak: number;
  bestStreak: number;
  /** Keyed by `verbId(verb)` — the base form. */
  verbs: Record<string, VerbStat>;
  /** Epoch ms of the first and last answer ever recorded. */
  startedAt: number;
  lastPlayed: number;
}

export const emptyProgress = (): Progress => ({
  version: 1,
  ok: 0,
  bad: 0,
  streak: 0,
  bestStreak: 0,
  verbs: {},
  startedAt: Date.now(),
  lastPlayed: Date.now(),
});

/** Reads progress, discarding anything that is not the current shape. */
export function loadProgress(): Progress {
  const saved = readJSON<Partial<Progress>>(PROGRESS_KEY);
  if (!saved || saved.version !== 1 || typeof saved.verbs !== 'object' || saved.verbs === null) {
    return emptyProgress();
  }
  const base = emptyProgress();
  return {
    ...base,
    ...saved,
    verbs: saved.verbs as Record<string, VerbStat>,
  };
}

export const saveProgress = (p: Progress): void => writeJSON(PROGRESS_KEY, p);

/**
 * Folds one answer into the progress object. Pure — returns a new object so
 * React state updates stay predictable.
 */
export function recordAnswer(p: Progress, id: string, correct: boolean): Progress {
  const prev = p.verbs[id] ?? { seen: 0, ok: 0, bad: 0, last: 0 };
  const streak = correct ? p.streak + 1 : 0;
  return {
    ...p,
    ok: p.ok + (correct ? 1 : 0),
    bad: p.bad + (correct ? 0 : 1),
    streak,
    bestStreak: Math.max(p.bestStreak, streak),
    lastPlayed: Date.now(),
    verbs: {
      ...p.verbs,
      [id]: {
        seen: prev.seen + 1,
        ok: prev.ok + (correct ? 1 : 0),
        bad: prev.bad + (correct ? 0 : 1),
        last: Date.now(),
      },
    },
  };
}

export interface WeakVerb {
  id: string;
  stat: VerbStat;
  /** 0–1. Share of attempts that were wrong. */
  errorRate: number;
}

/**
 * The verbs worth reviewing: missed at least once, hardest first.
 * Ties break towards the verb seen more often, so a 3/4 beats a 1/1.
 */
export function weakVerbs(p: Progress, limit = Infinity): WeakVerb[] {
  return Object.entries(p.verbs)
    .filter(([, s]) => s.bad > 0)
    .map(([id, stat]) => ({ id, stat, errorRate: stat.bad / Math.max(1, stat.seen) }))
    .sort((a, b) => b.errorRate - a.errorRate || b.stat.bad - a.stat.bad)
    .slice(0, limit);
}

/** How many distinct verbs have been answered correctly at least once. */
export const masteredCount = (p: Progress): number =>
  Object.values(p.verbs).filter((s) => s.ok > 0 && s.bad === 0).length;

export const attemptedCount = (p: Progress): number => Object.keys(p.verbs).length;

export const accuracy = (p: Progress): number => {
  const total = p.ok + p.bad;
  return total === 0 ? 0 : Math.round((p.ok / total) * 100);
};
