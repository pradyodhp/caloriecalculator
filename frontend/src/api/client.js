const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const KEY = 'nutritrack.refresh';

let accessToken = null;
let onLogout = () => {};
export const setLogoutHandler = (fn) => { onLogout = fn; };

export class ApiError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}

async function raw(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check that the API is running.', 'network');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data?.error?.message || 'Something went wrong', data?.error?.code);
  return data;
}

function store(t) {
  accessToken = t.accessToken;
  localStorage.setItem(KEY, t.refreshToken);
}

async function refresh() {
  const rt = localStorage.getItem(KEY);
  if (!rt) return false;
  try { store(await raw('/auth/refresh', { method: 'POST', body: { refreshToken: rt }, auth: false })); return true; }
  catch { localStorage.removeItem(KEY); accessToken = null; return false; }
}

export async function request(path, opts) {
  try { return await raw(path, opts); }
  catch (e) {
    if (e.status === 401 && opts?.auth !== false && (await refresh())) return raw(path, opts);
    if (e.status === 401 && opts?.auth !== false) onLogout();
    throw e;
  }
}

export const auth = {
  async register(email, password) { store(await raw('/auth/register', { method: 'POST', body: { email, password }, auth: false })); },
  async login(email, password) { store(await raw('/auth/login', { method: 'POST', body: { email, password }, auth: false })); },
  async restore() { return refresh(); },
  async logout() {
    const rt = localStorage.getItem(KEY);
    if (rt) await raw('/auth/logout', { method: 'POST', body: { refreshToken: rt }, auth: false }).catch(() => {});
    localStorage.removeItem(KEY); accessToken = null;
  },
};

export const api = {
  profile: () => request('/v1/profile'),
  saveProfile: (b) => request('/v1/profile', { method: 'PUT', body: b }),
  saveGoal: (b) => request('/v1/goal', { method: 'PUT', body: b }),
  addWeight: (kg, date) => request('/v1/weight', { method: 'POST', body: { kg, date } }),
  targets: () => request('/v1/targets'),
  diary: (date) => request(`/v1/diary${date ? `?date=${date}` : ''}`),
  addEntry: (b) => request('/v1/diary/entries', { method: 'POST', body: b }),
  deleteEntry: (id) => request(`/v1/diary/entries/${id}`, { method: 'DELETE' }),
  addWater: (amountMl, date) => request('/v1/water', { method: 'POST', body: { amountMl, date } }),
  search: (q) => request(`/foods/search?q=${encodeURIComponent(q)}&limit=12`),
  weightProgress: () => request('/v1/progress/weight'),
  weekly: () => request('/v1/analytics/weekly'),
  customFoods: () => request('/v1/foods/custom'),
  createCustom: (b) => request('/v1/foods/custom', { method: 'POST', body: b }),
  deleteCustom: (id) => request(`/v1/foods/custom/${id}`, { method: 'DELETE' }),
  recipes: () => request('/v1/recipes'),
  createRecipe: (b) => request('/v1/recipes', { method: 'POST', body: b }),
  deleteRecipe: (id) => request(`/v1/recipes/${id}`, { method: 'DELETE' }),
  compare: (a, b, grams) => request(`/v1/foods/compare?a=${a}&b=${b}&grams=${grams}`),
  favorites: () => request('/v1/favorites'),
  addFavorite: (id) => request(`/v1/favorites/${id}`, { method: 'PUT' }),
  removeFavorite: (id) => request(`/v1/favorites/${id}`, { method: 'DELETE' }),
  recents: () => request('/v1/recents'),
};
