import { useMemo } from 'react';
import type { Filter } from '../types';
import { firstForm, norm, pool } from '../lib/verbs';
import { say } from '../lib/speech';

interface Props {
  filter: Filter;
  query: string;
  onQueryChange: (q: string) => void;
  onSendToTranslate: () => void;
}

export default function VerbsTable({ filter, query, onQueryChange, onSendToTranslate }: Props) {
  const rows = useMemo(() => {
    const q = norm(query);
    const all = pool(filter);
    if (!q) return all;
    return all.filter((v) => [v.base, v.past, v.part, v.es].some((x) => norm(x).includes(q)));
  }, [filter, query]);

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

      <div className="tablewrap">
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
                  <span className={`badge ${v.type}`} style={{ fontSize: '.55rem' }}>
                    {v.type}
                  </span>
                </td>
                <td>
                  <span className="w">{v.base}</span>
                  <span className="p">/{v.ph[0]}/</span>
                </td>
                <td>
                  <span className="w">
                    {v.past}
                    {v.type === 'R' && v.ed && (
                      <>
                        {' '}
                        <span className="badge R" style={{ fontSize: '.55rem' }}>
                          /{v.ed}/
                        </span>
                      </>
                    )}
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
