import React, { useState } from 'react';
import { auth } from '../api/client';

export default function AuthPage({ onDone }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await (mode === 'login' ? auth.login(email, password) : auth.register(email, password));
      onDone();
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <main className="auth">
      <h1>NutriTrack</h1>
      <p className="tagline">Understand what you eat. Track what matters. Build better habits.</p>
      <form onSubmit={submit} className="card">
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          {mode === 'register' && <small>At least 10 characters.</small>}
        </label>
        {error && <p role="alert" className="error">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? 'One moment' : mode === 'login' ? 'Log in' : 'Create account'}</button>
        <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
        </button>
      </form>
    </main>
  );
}
