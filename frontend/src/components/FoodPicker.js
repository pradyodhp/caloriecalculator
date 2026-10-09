import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { SOURCE_LABELS } from '../lib/format';

// Small search box that returns the chosen food to the caller.
export default function FoodPicker({ label, onPick }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [msg, setMsg] = useState('');
  const seq = useRef(0);
  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); setMsg(''); return undefined; }
    const id = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const r = await api.search(q.trim());
        if (id === seq.current) { setResults(r.results); setMsg(r.results.length ? '' : 'No matches.'); }
      } catch (e) { if (id === seq.current) setMsg(e.message); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="picker">
      <input type="search" value={q} placeholder={label} aria-label={label} onChange={(e) => setQ(e.target.value)} />
      {msg && <p className="muted small" role="status">{msg}</p>}
      <ul className="results">
        {results.slice(0, 6).map((r) => (
          <li key={r.foodId}><button onClick={() => { onPick(r); setQ(''); setResults([]); }}>
            <strong>{r.description}</strong><small>{SOURCE_LABELS[r.sourceType] || r.source}</small></button></li>
        ))}
      </ul>
    </div>
  );
}
