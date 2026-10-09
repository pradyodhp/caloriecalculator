import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { fmt } from '../lib/format';

function monthKey(d) { return d.toISOString().slice(0, 7); }

export default function History({ onPick }) {
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1)); });
  const [days, setDays] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setDays(null);
    api.calendar(monthKey(month)).then((r) => { if (live) setDays(r.days); }).catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [month]);
  const first = month.getUTCDay();
  const count = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  const byDate = Object.fromEntries((days || []).map((d) => [d.date, d]));
  const shift = (n) => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + n, 1)));
  return (
    <section className="fade-in">
      <p className="eyebrow">History</p>
      <h1>{month.toLocaleString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h1>
      <p><button className="chip" onClick={() => shift(-1)}>Previous</button> <button className="chip" onClick={() => shift(1)}>Next</button></p>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="cal" role="grid" aria-busy={!days}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="cal-h">{d}</span>)}
        {Array.from({ length: first }).map((_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: count }).map((_, i) => {
          const date = `${monthKey(month)}-${String(i + 1).padStart(2, '0')}`;
          const d = byDate[date];
          return (
            <button key={date} className={`cal-d${d ? ' logged' : ''}`} onClick={() => onPick(date)} aria-label={d ? `${date}, ${fmt(d.kcal)} kcal logged` : `${date}, nothing logged`}>
              <span>{i + 1}</span>{d && <small>{fmt(d.kcal)}</small>}
            </button>
          );
        })}
      </div>
      <p className="muted small">Numbers are kcal logged that day. Blank days have nothing logged; that is not the same as zero.</p>
    </section>
  );
}
