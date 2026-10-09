import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import Ring from './Ring';
import FoodSearch from './FoodSearch';
import { NUTRIENT_LABELS, budgetState, fmt, nutrient, pct } from '../lib/format';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];

function MacroBar({ label, consumed, target, unit }) {
  return (
    <div className={`macro macro-${budgetState(consumed, target)}`}>
      <div className="macro-head"><span>{label}</span><span>{fmt(consumed)} / {fmt(target)} {unit}</span></div>
      <div className="bar" role="progressbar" aria-valuenow={Math.round(Math.min(100, pct(consumed, target)))} aria-valuemin="0" aria-valuemax="100" aria-label={label}>
        <div style={{ width: `${Math.min(100, pct(consumed, target))}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [day, setDay] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(null); // meal name

  const load = useCallback(async () => {
    try { setDay(await api.diary()); setError(''); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (error) return <div className="state" role="alert">{error} <button className="link" onClick={load}>Retry</button></div>;
  if (!day) return <div className="skeleton" aria-busy="true" aria-label="Loading your day" />;

  const t = day.targets;
  const kcal = nutrient(day.totals.nutrients, 'energy');

  async function remove(id) { await api.deleteEntry(id); load(); }
  async function water(ml) { await api.addWater(ml, day.date); load(); }

  return (
    <section className="fade-in">
      <p className="eyebrow">{day.date}</p>
      {t ? (
        <>
          <h1>{kcal <= t.kcal ? `${fmt(t.kcal - kcal)} kcal left today` : `${fmt(kcal - t.kcal)} kcal over today's estimate`}</h1>
          <div className="hero">
            <Ring consumed={kcal} target={t.kcal} unit="kcal" label="Calories" />
            <div className="macros">
              <MacroBar label="Protein" consumed={nutrient(day.totals.nutrients, 'protein')} target={t.proteinG} unit="g" />
              <MacroBar label="Carbohydrate" consumed={nutrient(day.totals.nutrients, 'carbohydrate')} target={t.carbG} unit="g" />
              <MacroBar label="Fat" consumed={nutrient(day.totals.nutrients, 'fat')} target={t.fatG} unit="g" />
              <MacroBar label="Fiber" consumed={nutrient(day.totals.nutrients, 'fiber')} target={t.fiberG} unit="g" />
            </div>
          </div>
          <p className="muted small">{t.label}. Estimates from standard formulas; individual needs vary.</p>
        </>
      ) : <div className="card">Targets need: {day.targetsMissing.join(', ')}.</div>}

      {day.totals.approximate && <p className="muted small">Some servings are estimates, so totals are approximate.</p>}

      <div className="water card">
        <strong>Water</strong> <span>{fmt(day.waterMl)} ml</span>
        <span className="spacer" />
        {[250, 500].map((ml) => <button key={ml} className="chip" onClick={() => water(ml)}>+{ml} ml</button>)}
      </div>

      {MEALS.map((m) => {
        const items = day.entries.filter((e) => e.meal === m);
        return (
          <details key={m} className="meal card" open>
            <summary><span className="cap">{m}</span><span>{fmt(nutrient(day.totals.byMeal[m], 'energy'))} kcal</span></summary>
            {items.length === 0 && <p className="muted">Nothing logged yet.</p>}
            <ul>
              {items.map((e) => (
                <li key={e.id}>
                  <div>
                    <strong>{e.foodName}</strong>
                    <small>{e.quantity} x {e.serving}{e.approximate ? ' (estimate)' : ''} - {fmt(e.grams, 1)} g - {e.source}</small>
                    <details className="inner"><summary>Nutrients</summary>
                      <dl>{e.nutrients.map((n) => <React.Fragment key={n.key}><dt>{NUTRIENT_LABELS[n.key] || n.key}</dt><dd>{fmt(n.value, 1)} {n.unit}</dd></React.Fragment>)}</dl>
                    </details>
                  </div>
                  <button className="link" onClick={() => remove(e.id)} aria-label={`Remove ${e.foodName}`}>Remove</button>
                </li>
              ))}
            </ul>
            <button className="chip" onClick={() => setAdding(m)}>Add food</button>
          </details>
        );
      })}

      {adding && <FoodSearch meal={adding} date={day.date} onClose={() => setAdding(null)} onAdded={() => { setAdding(null); load(); }} />}
    </section>
  );
}
