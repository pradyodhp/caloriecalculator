import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { fmt } from '../lib/format';

export default function Progress() {
  const [w, setW] = useState(null);
  const [wk, setWk] = useState(null);
  const [kg, setKg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { const [a, b] = await Promise.all([api.weightProgress(), api.weekly()]); setW(a); setWk(b); setError(''); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function log(e) {
    e.preventDefault();
    try { await api.addWeight(Number(kg)); setKg(''); load(); } catch (err) { setError(err.message); }
  }

  if (error && !w) return <div className="state" role="alert">{error}</div>;
  if (!w || !wk) return <div className="skeleton" aria-busy="true" />;

  const pts = w.trend;
  const min = Math.min(...pts.map((p) => p.kg));
  const max = Math.max(...pts.map((p) => p.kg));
  const span = max - min || 1;
  const path = pts.map((p, i) => `${pts.length === 1 ? 150 : (i / (pts.length - 1)) * 300},${70 - ((p.kg - min) / span) * 60}`).join(' ');

  return (
    <section className="fade-in">
      <h1>{w.changeKg === null ? 'Log your weight to see progress' : `${w.changeKg > 0 ? '+' : ''}${fmt(w.changeKg, 1)} kg since your first entry`}</h1>
      <form onSubmit={log} className="inline">
        <input type="number" step="0.1" min="20" max="400" placeholder="Weight (kg)" value={kg} onChange={(e) => setKg(e.target.value)} aria-label="Weight in kg" required />
        <button className="primary">Log weight</button>
      </form>
      {error && <p role="alert" className="error">{error}</p>}
      {pts.length >= 2 ? (
        <svg viewBox="0 0 300 80" className="chart" role="img" aria-label="Weight trend"><polyline points={path} /></svg>
      ) : <p className="muted">Add at least two entries to see a trend.</p>}
      {w.goal && <p className="muted">Goal progress: {fmt(w.goal.percentComplete)}% ({fmt(w.goal.startKg, 1)} to {fmt(w.goal.targetKg, 1)} kg)</p>}

      <h2>This week</h2>
      {!wk.analytics ? <p className="muted">Targets needed: {wk.targetsMissing.join(', ')}.</p> : (
        <>
          <p className="big">{wk.analytics.daysLogged} of {wk.analytics.days} days logged</p>
          <details className="card"><summary>Averages on logged days</summary>
            <dl className="grid"><dt>Calories</dt><dd>{wk.analytics.avgKcal === null ? '-' : fmt(wk.analytics.avgKcal)} kcal</dd>
              <dt>Protein</dt><dd>{wk.analytics.avgProteinG === null ? '-' : fmt(wk.analytics.avgProteinG, 1)} g</dd>
              <dt>Fiber</dt><dd>{wk.analytics.avgFiberG === null ? '-' : fmt(wk.analytics.avgFiberG, 1)} g</dd></dl>
          </details>
          {wk.insights.map((i) => (
            <details key={i.ruleId} className="card insight"><summary>{i.message}</summary>
              <p className="muted small">Based on: {Object.entries(i.evidence).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>
            </details>
          ))}
        </>
      )}
    </section>
  );
}
