import { useEffect, useMemo, useState } from 'react';
import type { Direction, DirMode, Verb } from '../types';
import { DICTS, dirLabel, localHit, resolveDir } from '../lib/translate';
import { ED_LABELS, firstForm } from '../lib/verbs';
import { say } from '../lib/speech';

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  dirMode: DirMode;
  onDirModeChange: (d: DirMode) => void;
  /** Set by the verb list when it hands a word over; runs the lookup on mount. */
  autoRun: boolean;
  onAutoRunHandled: () => void;
}

export default function Translator({
  query,
  onQueryChange,
  dirMode,
  onDirModeChange,
  autoRun,
  onAutoRunHandled,
}: Props) {
  /** The word actually looked up — stays put while the user edits the box. */
  const [submitted, setSubmitted] = useState<string | null>(autoRun ? query.trim() || null : null);

  // Clearing the flag is a parent update, so it must not happen during render.
  useEffect(() => {
    if (autoRun) onAutoRunHandled();
  }, [autoRun, onAutoRunHandled]);

  const runLookup = () => {
    const w = query.trim();
    if (w) setSubmitted(w);
  };

  const note = useMemo(() => {
    const w = query.trim();
    if (!w) return null;
    const d = resolveDir(w, dirMode);
    return { label: dirLabel(d), how: dirMode === 'auto' ? 'auto-detected' : 'set by you' };
  }, [query, dirMode]);

  const result = useMemo(() => {
    if (!submitted) return null;
    const dir = resolveDir(submitted, dirMode);
    return { word: submitted, dir, hit: localHit(submitted, dir) };
  }, [submitted, dirMode]);

  return (
    <div>
      <div className="searchRow">
        <input
          className="search"
          placeholder="Type a word or a short phrase…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              runLookup();
            }
          }}
          autoComplete="off"
          spellCheck={false}
          autoFocus
        />
        <button className="primary" onClick={runLookup}>
          🔎 Look up
        </button>
        <button className="ghost" onClick={() => query.trim() && say(query.trim())} title="Hear what you typed">
          🔊
        </button>
      </div>

      <div className="dirRow">
        {(
          [
            ['auto', '🪄 Auto'],
            ['en-es', '🇬🇧 EN → ES 🇪🇸'],
            ['es-en', '🇪🇸 ES → EN 🇬🇧'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={`dirBtn ${dirMode === id ? 'active' : ''}`}
            onClick={() => onDirModeChange(id)}
          >
            {label}
          </button>
        ))}
        <button
          className="dirBtn swap"
          title="Swap direction"
          onClick={() => {
            const d = resolveDir(query.trim(), dirMode);
            onDirModeChange(d === 'es-en' ? 'en-es' : 'es-en');
          }}
        >
          ⇄
        </button>
      </div>

      <div className="dirNote">
        {note && (
          <>
            <b>{note.label}</b> · {note.how} · press Enter to look it up
          </>
        )}
      </div>

      {result && (
        <div className="transResult show">
          {result.hit ? (
            <LocalResult verb={result.hit} dir={result.dir} />
          ) : (
            <>
              <div className="tHead">
                <b className="tEn">{result.word}</b>{' '}
                <button className="speak sm" onClick={() => say(result.word)} title="Listen">
                  🔊
                </button>
              </div>
              <div className="tEs">
                Not in the verb list — where do you want to look it up?{' '}
                <span className="pos">{dirLabel(result.dir)}</span>
              </div>
              <div className="dictGrid">
                {DICTS.map((d) => (
                  <a
                    key={d.id}
                    className="dictCard"
                    href={d.url(result.word, result.dir)}
                    target="_blank"
                    rel="noopener"
                  >
                    <span className="dIcon">{d.icon}</span>
                    <span className="dBody">
                      <b>{d.name}</b>
                      <span className="dTip">{d.tip}</span>
                    </span>
                    <span className="dArrow">↗</span>
                  </a>
                ))}
              </div>
              <span className="src">Opens in a new tab · nothing is sent until you choose</span>
            </>
          )}
        </div>
      )}

      <div className="transHint">
        Verbs from the list answer instantly and offline, with their forms, phonetics and audio.
        <br />
        Anything else opens in the dictionary you choose — nothing is sent until you pick one.
      </div>
    </div>
  );
}

function LocalResult({ verb: v, dir }: { verb: Verb; dir: Direction }) {
  const hear = (w: string) => (
    <button className="speak sm" onClick={() => say(w)} title="Listen">
      🔊
    </button>
  );

  return (
    <>
      <div className="tHead">
        <b className="tEn">{v.base}</b> <span className="aph">/{v.ph[0]}/</span> {hear(v.base)}
      </div>
      <div className="tEs">
        = {v.es} <span className="pos">{v.type === 'I' ? 'irregular' : 'regular'} verb</span>
      </div>
      <div className="tForms">
        <b>{v.base}</b> <span className="aph">/{v.ph[0]}/</span> {hear(v.base)} → <b>{v.past}</b>{' '}
        <span className="aph">/{v.ph[1]}/</span> {hear(firstForm(v.past))} → <b>{v.part}</b>{' '}
        <span className="aph">/{v.ph[2]}/</span> {hear(firstForm(v.part))}
      </div>
      {v.type === 'R' && v.ed && (
        <div className="tAlt" dangerouslySetInnerHTML={{ __html: ED_LABELS[v.ed] }} />
      )}
      <span className="src">
        ✓ From this app's verb list — works offline · look it up in{' '}
        {DICTS.slice(0, 3).map((d, i) => (
          <span key={d.id}>
            {i > 0 && ' · '}
            <a href={d.url(v.base, dir)} target="_blank" rel="noopener">
              {d.name} ↗
            </a>
          </span>
        ))}
      </span>
    </>
  );
}
