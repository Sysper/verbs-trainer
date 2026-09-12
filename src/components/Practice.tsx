import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Verb } from '../types';
import { ED_LABELS, firstForm, matches, shuffle, verbId, VERBS } from '../lib/verbs';
import { say } from '../lib/speech';
import type { Progress } from '../lib/storage';
import { weakVerbs } from '../lib/storage';
import ProgressPanel from './ProgressPanel';

interface Props {
  progress: Progress;
  onAnswer: (id: string, correct: boolean) => void;
  onReset: () => void;
}

type SlotState = 'idle' | 'ok' | 'bad';

export default function Practice({ progress, onAnswer, onReset }: Props) {
  const [current, setCurrent] = useState<Verb | null>(null);
  const [checked, setChecked] = useState(false);
  const [past, setPast] = useState('');
  const [part, setPart] = useState('');
  const [pastState, setPastState] = useState<SlotState>('idle');
  const [partState, setPartState] = useState<SlotState>('idle');
  const [verdict, setVerdict] = useState<{ good: boolean; text: string } | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

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
    clearSlots();
    pastRef.current?.focus();
  }, [activePool, clearSlots]);

  /** A new pool (filter change or review toggle) starts a fresh deck. */
  useEffect(() => {
    deck.current = [];
    nextVerb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePool]);

  const check = useCallback(() => {
    if (!current) return;
    const goodPast = matches(past, current.past);
    const goodPart = matches(part, current.part);
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
    say(`${firstForm(current.past)}. ${firstForm(current.part)}`);
    window.setTimeout(() => mainRef.current?.focus(), 0);
  }, [current, part, past, onAnswer]);

  const mainAction = useCallback(() => {
    if (checked) nextVerb();
    else check();
  }, [check, checked, nextVerb]);

  const skipVerb = useCallback(() => {
    if (current) onAnswer(verbId(current), false);
    nextVerb();
  }, [current, nextVerb, onAnswer]);

  /** Enter anywhere in the practice view checks or advances. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      mainAction();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mainAction]);

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
          <div className={`slot ${pastState === 'idle' ? '' : pastState}`}>
            <label htmlFor="inPast">Past simple</label>
            <input
              id="inPast"
              ref={pastRef}
              value={past}
              disabled={checked}
              onChange={(e) => setPast(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <div className="answer">
              <span className="word">{current.past}</span>
              <span className="aph">/{current.ph[1]}/</span>
              <button className="speak sm" title="Listen" onClick={() => say(firstForm(current.past))}>
                🔊
              </button>
            </div>
          </div>

          <div className={`slot ${partState === 'idle' ? '' : partState}`}>
            <label htmlFor="inPart">Past participle</label>
            <input
              id="inPart"
              value={part}
              disabled={checked}
              onChange={(e) => setPart(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <div className="answer">
              <span className="word">{current.part}</span>
              <span className="aph">/{current.ph[2]}/</span>
              <button className="speak sm" title="Listen" onClick={() => say(firstForm(current.part))}>
                🔊
              </button>
            </div>
          </div>
        </div>

        {checked && edLabel && (
          <div className="edtag show" dangerouslySetInnerHTML={{ __html: edLabel }} />
        )}
        {verdict && (
          <div className={`verdict show ${verdict.good ? 'good' : 'bad'}`}>{verdict.text}</div>
        )}

        <div className="actions">
          <button className="primary" ref={mainRef} onClick={mainAction}>
            {checked ? 'Next' : 'Check'}
          </button>
          <button className="ghost" onClick={skipVerb}>
            Skip
          </button>
        </div>
        <div className="hint">
          Press <b>Enter</b> to check · alternative forms are accepted (got/gotten, learnt/learned)
          <br />
          Phonetics are an approximation for Spanish speakers — tap 🔊 for the real sound.
        </div>
      </div>
    </div>
  );
}
