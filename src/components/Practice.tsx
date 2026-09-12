import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PracticeMode, Verb } from '../types';
import { buildOptions, ED_LABELS, firstForm, matches, shuffle, verbId, VERBS } from '../lib/verbs';
import { say } from '../lib/speech';
import type { Progress } from '../lib/storage';
import { MODE_KEY, readJSON, weakVerbs, writeJSON } from '../lib/storage';
import ProgressPanel from './ProgressPanel';

interface Props {
  progress: Progress;
  onAnswer: (id: string, correct: boolean) => void;
  onReset: () => void;
  /** False until a mode is picked, which is the first thing the tab asks. */
  started: boolean;
  onStart: () => void;
}

type SlotState = 'idle' | 'ok' | 'bad';

interface ModeInfo {
  id: PracticeMode;
  icon: string;
  name: string;
  blurb: string;
}

const MODES: readonly ModeInfo[] = [
  {
    id: 'write',
    icon: '✍️',
    name: 'Escribir',
    blurb: 'Teclea el pasado y el participio. Cuesta más y se fija mejor.',
  },
  {
    id: 'choice',
    icon: '🔘',
    name: 'Opción múltiple',
    blurb: 'Elige entre cuatro formas parecidas. Más rápido para empezar.',
  },
];

export default function Practice({ progress, onAnswer, onReset, started, onStart }: Props) {
  const [current, setCurrent] = useState<Verb | null>(null);
  const [checked, setChecked] = useState(false);
  const [past, setPast] = useState('');
  const [part, setPart] = useState('');
  const [pastState, setPastState] = useState<SlotState>('idle');
  const [partState, setPartState] = useState<SlotState>('idle');
  const [verdict, setVerdict] = useState<{ good: boolean; text: string } | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [mode, setMode] = useState<PracticeMode>(() =>
    readJSON<PracticeMode>(MODE_KEY) === 'choice' ? 'choice' : 'write',
  );
  /** Answer choices for the current verb. Empty while writing. */
  const [options, setOptions] = useState<{ past: string[]; part: string[] }>({ past: [], part: [] });
  const [picked, setPicked] = useState<{ past: string | null; part: string | null }>({
    past: null,
    part: null,
  });

  useEffect(() => {
    writeJSON(MODE_KEY, mode);
  }, [mode]);

  /** The input only exists once practice has started, so focus it then. */
  useEffect(() => {
    if (started && mode === 'write') pastRef.current?.focus();
  }, [started, mode]);

  const pastRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLButtonElement>(null);
  /** Remaining verbs in the current shuffle. A ref: it drives no rendering. */
  const deck = useRef<Verb[]>([]);

  /** In review mode the deck is only what has been missed before. */
  const activePool = useMemo<Verb[]>(() => {
    if (!reviewMode) return VERBS;
    const ids = new Set(weakVerbs(progress).map((w) => w.id));
    const missed = VERBS.filter((v) => ids.has(verbId(v)));
    return missed.length > 0 ? missed : VERBS;
    // `progress` is deliberately not a dependency: recomputing the pool on
    // every answer would reshuffle the deck mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewMode]);

  const clearSlots = useCallback(() => {
    setPast('');
    setPart('');
    setPicked({ past: null, part: null });
    setPastState('idle');
    setPartState('idle');
    setVerdict(null);
    setChecked(false);
  }, []);

  const nextVerb = useCallback(() => {
    const source = deck.current.length > 0 ? deck.current : shuffle(activePool);
    const picked = source[source.length - 1] ?? null;
    deck.current = source.slice(0, -1);
    setCurrent(picked);
    if (picked) setOptions({ past: buildOptions(picked, 'past'), part: buildOptions(picked, 'part') });
    clearSlots();
    if (mode === 'write') pastRef.current?.focus();
  }, [activePool, clearSlots, mode]);

  /** A new pool (filter change or review toggle) starts a fresh deck. */
  useEffect(() => {
    deck.current = [];
    nextVerb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePool]);

  /** What the user actually answered, whichever way the card asked. */
  const answers =
    mode === 'write' ? { past, part } : { past: picked.past ?? '', part: picked.part ?? '' };
  /** Multiple choice has nothing to grade until both forms are picked. */
  const ready = mode === 'write' || (picked.past !== null && picked.part !== null);

  const check = useCallback(() => {
    if (!current) return;
    const goodPast = matches(answers.past, current.past);
    const goodPart = matches(answers.part, current.part);
    setPastState(goodPast ? 'ok' : 'bad');
    setPartState(goodPart ? 'ok' : 'bad');
    setChecked(true);

    const allGood = goodPast && goodPart;
    setVerdict(
      allGood
        ? { good: true, text: 'Correct! 🎉 Now tap 🔊 and repeat it out loud.' }
        : { good: false, text: 'Almost — check the correct forms and listen to them.' },
    );
    onAnswer(verbId(current), allGood);
    // Nothing is spoken on its own: audio only ever plays from a 🔊 button.
    window.setTimeout(() => mainRef.current?.focus(), 0);
  }, [current, answers.part, answers.past, onAnswer]);

  const mainAction = useCallback(() => {
    if (checked) nextVerb();
    else if (ready) check();
  }, [check, checked, nextVerb, ready]);

  const skipVerb = useCallback(() => {
    if (current) onAnswer(verbId(current), false);
    nextVerb();
  }, [current, nextVerb, onAnswer]);

  /** Enter anywhere in the practice view checks or advances. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !started) return;
      e.preventDefault();
      mainAction();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mainAction, started]);

  if (!current) return null;

  const edLabel = current.type === 'R' && current.ed ? ED_LABELS[current.ed] : null;

  return (
    <div>
      <div className="score">
        <div className="chip">
          <b>{progress.ok}</b>correct
        </div>
        <div className="chip">
          <b>{progress.bad}</b>missed
        </div>
        <div className="chip streak">
          <b>{progress.streak}</b>streak 🔥
        </div>
        <button
          type="button"
          className="chip clickable"
          onClick={() => setShowStats((s) => !s)}
          aria-expanded={showStats}
        >
          <b>{progress.bestStreak}</b>best 🏅<small>{showStats ? 'hide stats' : 'see stats'}</small>
        </button>
      </div>

      {showStats && (
        <ProgressPanel
          progress={progress}
          reviewMode={reviewMode}
          onToggleReview={() => setReviewMode((r) => !r)}
          onReset={onReset}
        />
      )}

      {reviewMode && (
        <div className="reviewBanner">
          🎯 Review mode — only the verbs you have missed before
          <button type="button" className="ghost" onClick={() => setReviewMode(false)}>
            All verbs
          </button>
        </div>
      )}

      {!started && (
        <div className="starter">
          <h2 className="starterTitle">¿Cómo quieres practicar?</h2>
          <p className="starterSub">Elige un modo para empezar · podrás cambiarlo cuando quieras</p>
          <div className="starterGrid">
            {MODES.map((m) => (
              <button
                key={m.id}
                className={`starterCard ${mode === m.id ? 'last' : ''}`}
                onClick={() => {
                  setMode(m.id);
                  clearSlots();
                  onStart();
                }}
              >
                <span className="scIco" aria-hidden="true">
                  {m.icon}
                </span>
                <b>{m.name}</b>
                <span className="scBlurb">{m.blurb}</span>
                {mode === m.id && <span className="scLast">último usado</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {started && (
        <div className="modeRow" role="group" aria-label="Modo de práctica">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`modeBtn ${mode === m.id ? 'active' : ''}`}
            aria-pressed={mode === m.id}
            onClick={() => {
              if (m.id === mode) return;
              setMode(m.id);
              clearSlots();
            }}
          >
            <span aria-hidden="true">{m.icon}</span> {m.name}
          </button>
          ))}
        </div>
      )}

      {started && (
      <div className="card" key={current.base}>
        <div className="eyebrow">
          Base form <span className={`badge ${current.type}`}>{current.type === 'I' ? 'IRREGULAR' : 'REGULAR'}</span>
        </div>
        <div className="baseRow">
          <div className="base">{current.base}</div>
          <div className="ph">/{current.ph[0]}/</div>
          <button className="speak" title="Listen" onClick={() => say(current.base)}>
            🔊
          </button>
        </div>
        <div className="meaning">{current.es}</div>

        <div className="slots">
          <Slot
            id="inPast"
            label="Past simple"
            state={pastState}
            mode={mode}
            checked={checked}
            value={past}
            onValue={setPast}
            options={options.past}
            picked={picked.past}
            onPick={(o) => setPicked((p) => ({ ...p, past: o }))}
            answer={current.past}
            phonetic={current.ph[1]}
            inputRef={pastRef}
          />
          <Slot
            id="inPart"
            label="Past participle"
            state={partState}
            mode={mode}
            checked={checked}
            value={part}
            onValue={setPart}
            options={options.part}
            picked={picked.part}
            onPick={(o) => setPicked((p) => ({ ...p, part: o }))}
            answer={current.part}
            phonetic={current.ph[2]}
          />
        </div>

        {checked && edLabel && (
          <div className="edtag show" dangerouslySetInnerHTML={{ __html: edLabel }} />
        )}
        {verdict && (
          <div className={`verdict show ${verdict.good ? 'good' : 'bad'}`}>{verdict.text}</div>
        )}

        <div className="actions">
          <button className="primary" ref={mainRef} onClick={mainAction} disabled={!checked && !ready}>
            {checked ? 'Next' : 'Check'}
          </button>
          <button className="ghost" onClick={skipVerb}>
            Skip
          </button>
        </div>
        <div className="hint">
          {mode === 'write' ? (
            <>
              Press <b>Enter</b> to check · alternative forms are accepted (got/gotten, learnt/learned)
            </>
          ) : (
            <>
              Pick one option for each form, then press <b>Enter</b> or Check
            </>
          )}
          <br />
          Phonetics are an approximation for Spanish speakers — tap 🔊 for the real sound.
        </div>
      </div>
      )}
    </div>
  );
}

interface SlotProps {
  id: string;
  label: string;
  state: SlotState;
  mode: PracticeMode;
  checked: boolean;
  value: string;
  onValue: (v: string) => void;
  options: string[];
  picked: string | null;
  onPick: (option: string) => void;
  answer: string;
  phonetic: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}

/**
 * One form of the verb, asked either as a text field or as a set of choices.
 * Both paths feed the same grading, so the score, streak and review list do
 * not care which mode produced the answer.
 */
function Slot({
  id,
  label,
  state,
  mode,
  checked,
  value,
  onValue,
  options,
  picked,
  onPick,
  answer,
  phonetic,
  inputRef,
}: SlotProps) {
  return (
    <div className={`slot ${state === 'idle' ? '' : state}`}>
      <label htmlFor={mode === 'write' ? id : undefined}>{label}</label>

      {mode === 'write' ? (
        <input
          id={id}
          ref={inputRef}
          value={value}
          disabled={checked}
          onChange={(e) => onValue(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      ) : (
        <div className="choices">
          {options.map((option) => {
            // After checking, mark the answer green and a wrong pick red.
            const isAnswer = checked && matches(option, answer);
            const isWrongPick = checked && picked === option && !isAnswer;
            return (
              <button
                key={option}
                type="button"
                className={`choice ${picked === option ? 'picked' : ''} ${
                  isAnswer ? 'right' : ''
                } ${isWrongPick ? 'wrong' : ''}`}
                aria-pressed={picked === option}
                disabled={checked}
                onClick={() => onPick(option)}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}

      <div className="answer">
        <span className="word">{answer}</span>
        <span className="aph">/{phonetic}/</span>
        <button className="speak sm" title="Listen" onClick={() => say(firstForm(answer))}>
          🔊
        </button>
      </div>
    </div>
  );
}
