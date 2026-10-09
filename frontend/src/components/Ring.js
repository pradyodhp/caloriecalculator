import React from 'react';
import { budgetState, pct, fmt } from '../lib/format';

export default function Ring({ consumed, target, unit, label }) {
  const state = budgetState(consumed, target);
  const r = 70;
  const c = 2 * Math.PI * r;
  const filled = Math.min(100, pct(consumed, target));
  return (
    <figure className={`ring ring-${state}`} aria-label={`${label}: ${fmt(consumed)} of ${fmt(target)} ${unit}`}>
      <svg viewBox="0 0 160 160" role="img" aria-hidden="true">
        <circle cx="80" cy="80" r={r} className="ring-track" />
        <circle cx="80" cy="80" r={r} className="ring-fill" strokeDasharray={c} strokeDashoffset={c * (1 - filled / 100)} transform="rotate(-90 80 80)" />
      </svg>
      <figcaption>
        <strong>{fmt(Math.abs(target - consumed))}</strong>
        <span>{target - consumed >= 0 ? `${unit} left` : `${unit} over`}</span>
      </figcaption>
    </figure>
  );
}
