import { useMemo, useState } from 'react';
import { accuracy, attemptedCount, masteredCount, type Progress, weakVerbs } from '../lib/storage';
import { VERBS } from '../lib/verbs';

interface Props {
  progress: Progress;
  reviewMode: boolean;
  onToggleReview: () => void;
  onReset: () => void;
}

const WEAK_SHOWN = 8;

export default function ProgressPanel({ progress, reviewMode, onToggleReview, onReset }: Props) {
  const [confirming, setConfirming] = useState(false);

  const weak = useMemo(() => weakVerbs(progress, WEAK_SHOWN), [progress]);
  const meanings = useMemo(() => new Map(VERBS.map((v) => [v.base, v.es])), []);
  const totalWeak = useMemo(() => weakVerbs(progress).length, [progress]);
  const answered = progress.ok + progress.bad;

  return (
    <div className="progressPanel">
      <div className="progressHead">
        <h3>Your progress</h3>
        <span className="muted">
          {answered === 0 ? 'Nothing saved yet' : `Saved in this browser · ${answered} answers`}
        </span>
      </div>

      <div className="statGrid">
        <div className="statBox accent">
          <b>{accuracy(progress)}%</b>
          <span>accuracy</span>
        </div>
        <div className="statBox">
          <b>{progress.bestStreak}</b>
          <span>best streak</span>
        </div>
        <div className="statBox">
          <b>
            {masteredCount(progress)}
            <span style={{ fontSize: '.8rem' }}> / {VERBS.length}</span>
          </b>
          <span>mastered (never missed)</span>
        </div>
        <div className="statBox">
          <b>{attemptedCount(progress)}</b>
          <span>verbs practised</span>
        </div>
      </div>

      {weak.length > 0 && (
        <div className="weakList">
          <h4>
            Verbs to review{totalWeak > WEAK_SHOWN ? ` · top ${WEAK_SHOWN} of ${totalWeak}` : ''}
          </h4>
          {weak.map((w) => (
            <div className="weakRow" key={w.id}>
              <span className="wv">{w.id}</span>
              <span className="wes">{meanings.get(w.id) ?? ''}</span>
              <span className="wbar">
                <i style={{ width: `${Math.round(w.errorRate * 100)}%` }} />
              </span>
              <span className="wpct">
                {w.stat.bad}/{w.stat.seen}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="progressActions">
        <button
          type="button"
          className={reviewMode ? 'primary' : 'ghost'}
          onClick={onToggleReview}
          disabled={totalWeak === 0}
          title={totalWeak === 0 ? 'Nothing missed yet — keep practising' : undefined}
        >
          🎯 {reviewMode ? 'Practising missed verbs' : 'Practise missed verbs'}
        </button>
        {confirming ? (
          <>
            <button
              type="button"
              className="primary"
              onClick={() => {
                onReset();
                setConfirming(false);
              }}
            >
              Yes, erase everything
            </button>
            <button type="button" className="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className="ghost" onClick={() => setConfirming(true)} disabled={answered === 0}>
            🗑️ Reset progress
          </button>
        )}
      </div>

      <p className="savedNote">
        Progress is stored only in this browser (localStorage). It is not sent anywhere and it will
        not follow you to another device — that needs an account, which is still to come.
      </p>
    </div>
  );
}
