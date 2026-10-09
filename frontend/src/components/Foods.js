import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import FoodPicker from './FoodPicker';
import { NUTRIENT_LABELS, fmt } from '../lib/format';

const FIELDS = [['energy', 'Energy', 'kcal'], ['protein', 'Protein', 'g'], ['carbohydrate', 'Carbohydrate', 'g'], ['fat', 'Fat', 'g'], ['fiber', 'Fiber', 'g']];

function CustomFoods() {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [vals, setVals] = useState({});
  const [error, setError] = useState('');
  const load = useCallback(() => api.customFoods().then((r) => setList(r.foods)).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);
  async function save(e) {
    e.preventDefault(); setError('');
    const nutrients = FIELDS.filter(([k]) => vals[k] !== undefined && vals[k] !== '').map(([key, , unit]) => ({ key, unit, value: Number(vals[key]) }));
    if (!nutrients.length) { setError('Enter at least one nutrient value, per 100 g.'); return; }
    try { await api.createCustom({ name, nutrients, servings: [] }); setName(''); setVals({}); load(); } catch (err) { setError(err.message); }
  }
  return (
    <details className="card" open>
      <summary><strong>My foods</strong></summary>
      <p className="muted small">Your own entries are labelled unverified. Leave blank what you do not know; blanks are never counted as zero.</p>
      <form onSubmit={save}>
        <label>Name<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
        {FIELDS.map(([k, l, u]) => <label key={k}>{l} per 100 g ({u})<input type="number" min="0" step="any" value={vals[k] ?? ''} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} /></label>)}
        {error && <p role="alert" className="error">{error}</p>}
        <button className="primary">Save food</button>
      </form>
      <ul className="plain">{list.map((f) => (
        <li key={f.foodId}><span>{f.food.description}</span>
          <button className="link" onClick={async () => { await api.deleteCustom(f.foodId); load(); }} aria-label={`Delete ${f.food.description}`}>Delete</button></li>))}</ul>
    </details>
  );
}

function Recipes() {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [servings, setServings] = useState('2');
  const [ings, setIngs] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => api.recipes().then((r) => setList(r.recipes)).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);
  async function save() {
    setError(''); setResult(null);
    try {
      const r = await api.createRecipe({ name, servings: Number(servings), ingredients: ings.map((i) => ({ foodId: i.foodId, grams: Number(i.grams) })) });
      setResult(r); setName(''); setIngs([]); load();
    } catch (e) { setError(e.message); }
  }
  return (
    <details className="card">
      <summary><strong>Recipes</strong></summary>
      <label>Recipe name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>Servings it makes<input type="number" min="1" step="any" value={servings} onChange={(e) => setServings(e.target.value)} /></label>
      <FoodPicker label="Add an ingredient" onPick={(f) => setIngs([...ings, { foodId: f.foodId, name: f.description, grams: '100' }])} />
      <ul className="plain">{ings.map((i, n) => (
        <li key={n}><span>{i.name}</span>
          <input className="grams" type="number" min="1" aria-label={`Grams of ${i.name}`} value={i.grams} onChange={(e) => setIngs(ings.map((x, m) => (m === n ? { ...x, grams: e.target.value } : x)))} /> g
          <button className="link" onClick={() => setIngs(ings.filter((_, m) => m !== n))}>Remove</button></li>))}</ul>
      {error && <p role="alert" className="error">{error}</p>}
      <button className="primary" disabled={!name || !ings.length} onClick={save}>Save recipe</button>
      {result && (
        <div className="fade-in">
          <p><strong>Per serving</strong> ({fmt(result.servingGrams, 0)} g, raw ingredient weights)</p>
          <dl>{result.perServing.map((n) => <React.Fragment key={n.key}><dt>{NUTRIENT_LABELS[n.key] || n.key}</dt><dd>{fmt(n.value, 1)} {n.unit}</dd></React.Fragment>)}</dl>
          {result.omittedIncompleteNutrients.length > 0 && <p className="muted small">Left out because some ingredient lacks them: {result.omittedIncompleteNutrients.join(', ')}.</p>}
          <p className="muted small">It is now searchable as a food.</p>
        </div>
      )}
      <ul className="plain">{list.map((r) => (
        <li key={r.id}><span>{r.name} <small className="muted">{r.ingredientCount} {r.ingredientCount === 1 ? "ingredient" : "ingredients"}, {r.servings} {r.servings === 1 ? "serving" : "servings"}</small></span>
          <button className="link" onClick={async () => { await api.deleteRecipe(r.id); load(); }}>Delete</button></li>))}</ul>
    </details>
  );
}

function Compare() {
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  const [grams, setGrams] = useState('100');
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');
  async function run() {
    setError('');
    try { setRes(await api.compare(a.foodId, b.foodId, Number(grams))); } catch (e) { setError(e.message); }
  }
  return (
    <details className="card">
      <summary><strong>Compare two foods</strong></summary>
      <p className="muted small">Same weight, side by side. No food is rated good or bad.</p>
      {a ? <p>A: <strong>{a.description}</strong> <button className="link" onClick={() => setA(null)}>Change</button></p> : <FoodPicker label="Search food A" onPick={setA} />}
      {b ? <p>B: <strong>{b.description}</strong> <button className="link" onClick={() => setB(null)}>Change</button></p> : <FoodPicker label="Search food B" onPick={setB} />}
      <label>Weight (g)<input type="number" min="1" value={grams} onChange={(e) => setGrams(e.target.value)} /></label>
      <button className="primary" disabled={!a || !b} onClick={run}>Compare</button>
      {error && <p role="alert" className="error">{error}</p>}
      {res && (
        <table className="cmp fade-in"><thead><tr><th /><th>{res.a.name}</th><th>{res.b.name}</th></tr></thead>
          <tbody>{res.rows.map((r) => (
            <tr key={r.key}><th>{NUTRIENT_LABELS[r.key] || r.key}</th>
              <td>{r.a == null ? 'n/a' : `${fmt(r.a.value ?? r.a, 1)} ${r.unit || ''}`}</td>
              <td>{r.b == null ? 'n/a' : `${fmt(r.b.value ?? r.b, 1)} ${r.unit || ''}`}</td></tr>))}</tbody>
          <caption>{res.note}</caption></table>
      )}
    </details>
  );
}

function Favorites() {
  const [fav, setFav] = useState([]);
  const [rec, setRec] = useState([]);
  const load = useCallback(() => { api.favorites().then((r) => setFav(r.favorites)).catch(() => {}); api.recents().then((r) => setRec(r.recents)).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);
  const favIds = new Set(fav.map((f) => f.foodId));
  async function toggle(id) { if (favIds.has(id)) await api.removeFavorite(id); else await api.addFavorite(id); load(); }
  return (
    <details className="card">
      <summary><strong>Favorites and recent</strong></summary>
      <h3>Favorites</h3>
      {fav.length === 0 && <p className="muted">Star a recent food to keep it here.</p>}
      <ul className="plain">{fav.map((f) => <li key={f.foodId}><span>{f.name}</span><button className="link" onClick={() => toggle(f.foodId)}>Unstar</button></li>)}</ul>
      <h3>Recently logged</h3>
      {rec.length === 0 && <p className="muted">Nothing logged yet.</p>}
      <ul className="plain">{rec.map((f) => <li key={f.foodId}><span>{f.name}</span><button className="link" onClick={() => toggle(f.foodId)}>{favIds.has(f.foodId) ? 'Unstar' : 'Star'}</button></li>)}</ul>
    </details>
  );
}

export default function Foods() {
  return <section className="fade-in"><p className="eyebrow">Your food library</p><h1>Foods</h1><Favorites /><CustomFoods /><Recipes /><Compare /></section>;
}
