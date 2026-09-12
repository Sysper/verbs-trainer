import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { firstForm, norm, VERBS } from '../lib/verbs';
import { say } from '../lib/speech';

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  onSendToTranslate: () => void;
}

/** Which sides still have content hidden past the edge of the scroller. */
interface Edges {
  left: boolean;
  right: boolean;
}

export default function VerbsTable({ query, onQueryChange, onSendToTranslate }: Props) {
  const rows = useMemo(() => {
    const q = norm(query);
    if (!q) return VERBS;
    return VERBS.filter((v) => [v.base, v.past, v.part, v.es].some((x) => norm(x).includes(q)));
  }, [query]);

  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edges>({ left: false, right: false });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // 2px of slack: sub-pixel widths never settle on an exact 0 or max.
    setEdges({ left: el.scrollLeft > 2, right: max > 2 && el.scrollLeft < max - 2 });
  }, []);

  // Runs before paint so the fade is right on the first frame, and again
  // whenever the row count or the viewport changes the scrollable width.
  useLayoutEffect(measure, [measure, rows.length]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  const scrollable = edges.left || edges.right;

  return (
    <div>
      <div className="searchRow">
        <input
          className="search"
          placeholder="Filter the verb list…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSendToTranslate();
            }
          }}
          autoComplete="off"
          spellCheck={false}
        />
        <button className="ghost" onClick={() => query.trim() && say(query.trim())} title="Hear what you typed">
          🔊
        </button>
      </div>

      {/* Announced before the table, so it is read and seen before the
          content it explains. */}
      {scrollable && (
        <p className="scrollHint" role="status">
          <span aria-hidden="true">↔</span> Desliza para ver más · Swipe for more
        </p>
      )}

      {/* The fades sit outside the scroller so they stay pinned to its edges. */}
      <div className="tableShell">
        <div className={`edgeFade left ${edges.left ? 'show' : ''}`} aria-hidden="true" />
        <div className={`edgeFade right ${edges.right ? 'show' : ''}`} aria-hidden="true" />
        <div className="tablewrap" ref={scroller}>
          <table>
            <thead>
              <tr>
                <th />
                <th>Base</th>
                <th>Past simple</th>
                <th>Past participle</th>
                <th>Español</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.base}>
                  <td>
                    <span className={`badge ${v.type}`}>{v.type}</span>
                  </td>
                  <td>
                    <span className="w">{v.base}</span>
                    <span className="p">/{v.ph[0]}/</span>
                  </td>
                  <td>
                    <span className="w">
                      {v.past}
                      {v.type === 'R' && v.ed && <span className="badge R edBadge">/{v.ed}/</span>}
                    </span>
                    <span className="p">/{v.ph[1]}/</span>
                  </td>
                  <td>
                    <span className="w">{v.part}</span>
                    <span className="p">/{v.ph[2]}/</span>
                  </td>
                  <td className="es">{v.es}</td>
                  <td>
                    <button
                      className="speak sm"
                      title="Listen"
                      onClick={() => say(`${v.base}. ${firstForm(v.past)}. ${firstForm(v.part)}`)}
                    >
                      🔊
                    </button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && query.trim() && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <div>
                        "<span className="q">{query.trim()}</span>" is not in the verb list.
                      </div>
                      <div className="row">
                        <button className="primary" onClick={onSendToTranslate}>
                          🔎 Look it up in Translate
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="legend">
        <b>How to read the phonetics</b> (approximation for Spanish speakers): <span className="k">j</span> = English
        "h" as in <i>house</i> · <span className="k">z</span> = "th" as in <i>think</i> (tongue between teeth) ·{' '}
        <span className="k">sh</span> = "sh" as in <i>she</i> · the accent mark (´) shows the stressed syllable.
        <br />
        <b>Regular -ed endings:</b> after unvoiced sounds it sounds like <span className="k">/t/</span> (worked =
        "uórkt") · after voiced sounds like <span className="k">/d/</span> (played = "pléid") · after <b>t</b> or{' '}
        <b>d</b> it adds a syllable <span className="k">/id/</span> (wanted = "uóntid").
      </div>
    </div>
  );
}
