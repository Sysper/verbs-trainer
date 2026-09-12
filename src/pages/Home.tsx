import { useCallback, useState } from 'react';
import type { DirMode, Filter, View } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useProgress } from '../hooks/useProgress';
import { useSession } from '../hooks/useSession';
import { useToast } from '../hooks/useToast';
import Practice from '../components/Practice';
import VerbsTable from '../components/VerbsTable';
import Translator from '../components/Translator';
import StarButton from '../components/StarButton';
import Donate from '../components/Donate';
import Toast from '../components/Toast';

const TABS: ReadonlyArray<[View, string]> = [
  ['quiz', 'Practice'],
  ['study', 'Verb list'],
  ['translate', 'Translate'],
];

const FILTERS: ReadonlyArray<[Filter, string]> = [
  ['all', 'All verbs'],
  ['I', 'Irregular'],
  ['R', 'Regular (-ed)'],
];

export default function Home() {
  const [theme, toggleTheme] = useTheme();
  const { progress, record, reset } = useProgress();
  const { session, signOut } = useSession();
  const { message, toast } = useToast();

  const [view, setView] = useState<View>('quiz');
  const [filter, setFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [transQuery, setTransQuery] = useState('');
  const [dirMode, setDirMode] = useState<DirMode>('auto');
  const [autoRun, setAutoRun] = useState(false);

  /** Hand the word from the verb list over to the Translate tab and run it. */
  const sendToTranslate = useCallback(() => {
    const w = searchQuery.trim();
    if (!w) return;
    setTransQuery(w);
    setAutoRun(true);
    setView('translate');
  }, [searchQuery]);

  return (
    <div className="wrap">
      <header>
        <h1>
          Verbs <span>Trainer</span>
        </h1>
        <div className="headRight">
          {session ? (
            <span className="whoami">
              {session.email}
              <button onClick={signOut}>Sign out</button>
            </span>
          ) : (
            <div className="sub">irregular + regular · with sound ✍️🔊</div>
          )}
          <button className="themeBtn" onClick={toggleTheme} aria-label="Switch theme" title="Switch theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <StarButton />

      <div className="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} className={`tab ${view === id ? 'active' : ''}`} onClick={() => setView(id)}>
            {label}
          </button>
        ))}
      </div>

      {/* The filter row only makes sense next to the practice card and the table. */}
      {view !== 'translate' && (
        <div className="filters">
          {FILTERS.map(([id, label]) => (
            <button key={id} className={`filt ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
      )}

      {view === 'quiz' && (
        <Practice filter={filter} progress={progress} onAnswer={record} onReset={reset} />
      )}

      {view === 'study' && (
        <VerbsTable
          filter={filter}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onSendToTranslate={sendToTranslate}
        />
      )}

      {view === 'translate' && (
        <Translator
          query={transQuery}
          onQueryChange={setTransQuery}
          dirMode={dirMode}
          onDirModeChange={setDirMode}
          autoRun={autoRun}
          onAutoRunHandled={() => setAutoRun(false)}
        />
      )}

      <Donate toast={toast} />
      <Toast message={message} />
    </div>
  );
}
