import { useCallback, useState } from 'react';
import type { DirMode, View } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useProgress } from '../hooks/useProgress';
import { useSession } from '../hooks/useSession';
import { useToast } from '../hooks/useToast';
import Practice from '../components/Practice';
import VerbsTable from '../components/VerbsTable';
import Translator from '../components/Translator';
import StarButton from '../components/StarButton';
import Donate from '../components/Donate';
import SupportFab from '../components/SupportFab';
import NequiHelp from '../components/NequiHelp';
import Toast from '../components/Toast';
import { useSupport } from '../hooks/useSupport';

const TABS: ReadonlyArray<[View, string]> = [
  ['quiz', 'Practice'],
  ['study', 'Verb list'],
  ['translate', 'Translate'],
];

export default function Home() {
  const [theme, toggleTheme] = useTheme();
  const { progress, record, reset } = useProgress();
  const { session, signOut } = useSession();
  const { message, toast } = useToast();
  const { nequiHelp, closeNequiHelp, copyPay, nequiPSE, hasAny } = useSupport(toast);

  const [view, setView] = useState<View>('quiz');
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
          <StarButton />
          {session && (
            <span className="whoami">
              {session.email}
              <button onClick={signOut}>Sign out</button>
            </span>
          )}
          {/* The label says what the button will DO, not what is on now. */}
          <button
            className="themeBtn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Modo claro · Light mode' : 'Modo oscuro · Dark mode'}
          >
            <span className="themeIcon" aria-hidden="true">
              {theme === 'dark' ? '☀️' : '🌙'}
            </span>
            <span className="themeLabel">
              {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              {/* Dropped on very narrow phones so the row never wraps. */}
              <span className="themeLabelEn">{theme === 'dark' ? ' · Light' : ' · Dark'}</span>
            </span>
          </button>
        </div>
      </header>

      {/* One column on phones and tablets; on wide screens the support panel
          becomes a sticky right-hand column instead of sinking to the bottom. */}
      <div className="layout">
        <div className="mainCol">
          {/* Plain buttons rather than a segmented tab bar: aria-pressed says
              which one is on, which is what a toggle button reports. */}
          <div className="tabs">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                className={`tab ${view === id ? 'active' : ''}`}
                aria-pressed={view === id}
                onClick={() => setView(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {view === 'quiz' && (
            <Practice progress={progress} onAnswer={record} onReset={reset} />
          )}

          {view === 'study' && (
            <VerbsTable
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
        </div>

        {hasAny && (
          <aside className="sideCol">
            <Donate copyPay={copyPay} nequiPSE={nequiPSE} />
          </aside>
        )}
      </div>

      {hasAny && <SupportFab copyPay={copyPay} nequiPSE={nequiPSE} />}
      {nequiHelp && <NequiHelp number={nequiHelp} onClose={closeNequiHelp} copyPay={copyPay} />}
      <Toast message={message} />
    </div>
  );
}
