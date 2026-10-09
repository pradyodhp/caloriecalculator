import React, { useState } from 'react';
import { api } from '../api/client';

const GOALS = [
  ['lose_weight', 'Lose weight'], ['maintain_weight', 'Maintain weight'], ['gain_weight', 'Gain weight'],
  ['build_muscle', 'Build muscle'], ['improve_protein', 'Improve protein intake'], ['improve_fiber', 'Improve fiber intake'],
  ['balanced', 'General balanced nutrition'],
];

export default function Onboarding({ onDone }) {
  const [f, setF] = useState({ dateOfBirth: '', biologicalSex: 'female', heightCm: '', weightKg: '', activityLevel: 'light', goal: 'maintain_weight', pace: 'standard' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      await api.saveProfile({ dateOfBirth: f.dateOfBirth, biologicalSex: f.biologicalSex, heightCm: Number(f.heightCm), activityLevel: f.activityLevel, timezone: tz });
      await api.addWeight(Number(f.weightKg));
      await api.saveGoal({ type: f.goal, pace: f.pace, startWeightKg: Number(f.weightKg) });
      onDone();
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <main className="narrow">
      <h1>Set your estimated targets</h1>
      <p className="muted">We use standard formulas to estimate a daily energy target. These are estimates, not medical advice.</p>
      <form onSubmit={submit} className="card">
        <label>Date of birth<input type="date" value={f.dateOfBirth} onChange={set('dateOfBirth')} required /></label>
        <label>Sex used in the formula
          <select value={f.biologicalSex} onChange={set('biologicalSex')}><option value="female">Female</option><option value="male">Male</option></select>
        </label>
        <label>Height (cm)<input type="number" min="100" max="250" step="0.1" value={f.heightCm} onChange={set('heightCm')} required /></label>
        <label>Weight (kg)<input type="number" min="20" max="400" step="0.1" value={f.weightKg} onChange={set('weightKg')} required /></label>
        <label>Activity
          <select value={f.activityLevel} onChange={set('activityLevel')}>
            <option value="sedentary">Sedentary</option><option value="light">Light</option><option value="moderate">Moderate</option>
            <option value="active">Active</option><option value="very_active">Very active</option>
          </select>
        </label>
        <label>Goal<select value={f.goal} onChange={set('goal')}>{GOALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label>Pace<select value={f.pace} onChange={set('pace')}><option value="gentle">Gentle</option><option value="standard">Standard</option><option value="ambitious">Ambitious</option></select></label>
        {error && <p role="alert" className="error">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Calculating' : 'See my targets'}</button>
      </form>
    </main>
  );
}
