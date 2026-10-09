import React, { useEffect, useState } from 'react';
import { api, auth, setLogoutHandler } from './api/client';
import AuthPage from './components/AuthPage';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Progress from './components/Progress';
import Foods from './components/Foods';
import History from './components/History';

export default function App() {
  const [phase, setPhase] = useState('loading'); // loading | auth | onboarding | app
  const [tab, setTab] = useState('today');
  const [viewDate, setViewDate] = useState(null);

  async function route() {
    try {
      const { profile } = await api.profile();
      const t = await api.targets().then(() => true).catch(() => false);
      setPhase(profile && t ? 'app' : 'onboarding');
    } catch { setPhase('auth'); }
  }

  useEffect(() => {
    setLogoutHandler(() => setPhase('auth'));
    auth.restore().then((ok) => (ok ? route() : setPhase('auth')));
  }, []);

  if (phase === 'loading') return <div className="skeleton" aria-busy="true" aria-label="Loading" />;
  if (phase === 'auth') return <AuthPage onDone={route} />;
  if (phase === 'onboarding') return <Onboarding onDone={route} />;

  return (
    <>
      <header className="top">
        <strong>NutriTrack</strong>
        <nav aria-label="Main">
          {[['today', 'Today'], ['history', 'History'], ['foods', 'Foods'], ['progress', 'Progress']].map(([k, l]) => (
            <button key={k} className={tab === k ? 'active' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{l}</button>
          ))}
          <button onClick={async () => { await auth.logout(); setPhase('auth'); }}>Log out</button>
        </nav>
      </header>
      <main>{tab === 'today' ? <Dashboard key={viewDate || 'now'} initialDate={viewDate} onDateChange={setViewDate} /> : tab === 'history' ? <History onPick={(d) => { setViewDate(d); setTab('today'); }} /> : tab === 'foods' ? <Foods /> : <Progress />}</main>
      <footer className="foot">General nutrition information, not medical advice. Targets are estimates.</footer>
    </>
  );
}
