/** A verb exactly as it is stored in `src/data/verbs.json`. */
export interface Verb {
  base: string;
  /** May hold alternatives separated by "/", e.g. "got/gotten". */
  past: string;
  part: string;
  /** Spanish meaning. */
  es: string;
  /** I = irregular, R = regular. */
  type: VerbType;
  /** Spanish-friendly phonetics: [base, past, participle]. */
  ph: [string, string, string];
  /** Sound of the "-ed" ending. Regular verbs only. */
  ed?: EdSound;
}

export type VerbType = 'I' | 'R';
export type EdSound = 't' | 'd' | 'id';
export type Filter = 'all' | VerbType;
export type View = 'quiz' | 'study' | 'translate';
export type Direction = 'en-es' | 'es-en';
export type DirMode = 'auto' | Direction;
