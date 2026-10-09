import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { NUTRIENT_LABELS, SOURCE_LABELS, fmt } from '../lib/format';

export default function FoodSearch({ meal, date, onClose, onAdded }) {
  const [q, setQ] = useState('');
  const [state, setState] = useState({ status: 'idle', results: [], errors: [] });
  const [picked, setPicked] = useState(null);
  const [qty, setQty] = useState('1');
  const [serving, setServing] = useState('100 g');
  const [error, setError] = useState('');
  const seq = useRef(0);

  useEffect(() => {
    if (q.trim().length < 2) { setState({ status: 'idle', results: [], errors: [] }); return undefined; }
    const id = ++seq.current;
    setState((s) => ({ ...s, status: 'loading' }));
    const t = setTimeout(async () => {
      try {
        const r = await api.search(q.trim());
        if (id === seq.current) setState({ status: 'done', results: r.results, errors: r.providerErrors });
      } catch (e) { if (id === seq.current) setState({ status: 'error', results: [], errors: [], message: e.message }); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function add() {
    setError('');
    try {
      await api.addEntry({ date, meal, foodId: picked.foodId, quantity: Number(qty), servingLabel: serving });
      onAdded();
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={`Add food to ${meal}`}>
      <div className="sheet-body">
        <div className="sheet-head"><h2>Add to {meal}</h2><button className="link" onClick={onClose}>Close</button></div>
        {!picked ? (
          <>
            <input autoFocus type="search" placeholder="Search foods, e.g. rice" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search foods" />
            {state.status === 'loading' && <div className="skeleton small" aria-busy="true" />}
            {state.status === 'error' && <p role="alert" className="error">{state.message}</p>}
            {state.status === 'done' && state.results.length === 0 && <p className="muted">No matches. Try a simpler name. Prepared dishes like idli are not in the Indian dataset yet; you can create a custom food.</p>}
            {state.errors?.length > 0 && <p className="muted small">Some sources were unavailable: {state.errors.map((e) => e.provider).join(', ')}.</p>}
            <ul className="results">
              {state.results.map((r) => (
                <li key={r.foodId}>
                  <button onClick={() => { setPicked(r); setServing('100 g'); }}>
                    <strong>{r.description}</strong>
                    <small>{SOURCE_LABELS[r.sourceType] || r.source} - per 100 g</small>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="fade-in">
            <h3>{picked.description}</h3>
            <p className="muted small">{SOURCE_LABELS[picked.sourceType] || picked.source}, ID {picked.sourceId}. Values per 100 g.</p>
            <dl className="grid">{picked.nutrients.map((n) => <React.Fragment key={n.key}><dt>{NUTRIENT_LABELS[n.key] || n.key}</dt><dd>{fmt(n.value, 1)} {n.unit}</dd></React.Fragment>)}</dl>
            <label>Serving
              <select value={serving} onChange={(e) => setServing(e.target.value)}>
                <option>100 g</option><option>1 g</option><option>1 oz</option>
              </select>
            </label>
            <label>Quantity<input type="number" min="0.1" step="0.1" value={qty} onChange={(e) => setQty(e.target.value)} /></label>
            {error && <p role="alert" className="error">{error}</p>}
            <button className="primary" onClick={add}>Add to {meal}</button>
            <button className="link" onClick={() => setPicked(null)}>Back to results</button>
          </div>
        )}
      </div>
    </div>
  );
}
