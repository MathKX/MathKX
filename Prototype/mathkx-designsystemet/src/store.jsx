import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { translate, pick } from './i18n.js';

// ---- Simulated persistence ------------------------------------------------
// Profiles live in localStorage (simulating a server). The current session's
// work (typed answers, open help, position in a set) lives in sessionStorage so
// it survives reloads, rotation and language switches.
const LS_KEY = 'mathkx-proto-profiles-v1';
const SS_KEY = 'mathkx-proto-session-v1';

function safeGet(storage, key) {
  try { const v = storage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function safeSet(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable: keep in memory */ }
}
const ls = () => { try { return window.localStorage; } catch { return null; } };
const ss = () => { try { return window.sessionStorage; } catch { return null; } };

export const DEMO = { id: 'MKX-DEMO-4K7P', password: 'tiervenner10' };

// Toy hash, only to avoid storing the prototype password verbatim. Not security.
function toyHash(s) { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }

function demoProfile() {
  const now = Date.now();
  return {
    id: DEMO.id, pw: toyHash(DEMO.password), email: null, emailVerified: false, createdAt: now - 6 * 864e5,
    progress: {
      lessons: { 'number-bonds-to-ten': { explored: true, at: now - 2 * 864e5 } },
      attempts: [
        { qid: 'add-4-4', set: 'addition-visual', mode: 'practice', correct: true, help: ['visual'], answer: '8', at: now - 2 * 864e5 },
        { qid: 'add-3-5', set: 'addition-visual', mode: 'practice', correct: true, help: [], answer: '8', at: now - 2 * 864e5 + 6e4 },
        { qid: 'add-8-5', set: 'addition-visual', mode: 'practice', correct: true, help: ['visual', 'make-ten'], answer: '13', at: now - 2 * 864e5 + 2e5 },
      ],
      last: { href: '#/practice/addition-visual', kind: 'practice', id: 'addition-visual', at: now - 2 * 864e5 },
    },
  };
}

const emptyProgress = () => ({ lessons: {}, attempts: [], last: null });

function initialState() {
  const saved = safeGet(ss() ?? {}, SS_KEY) ?? {};
  const profiles = safeGet(ls() ?? {}, LS_KEY) ?? {};
  if (!profiles[DEMO.id]) profiles[DEMO.id] = demoProfile();
  return {
    lang: saved.lang ?? 'nb',
    profileId: saved.profileId && profiles[saved.profileId] ? saved.profileId : null,
    profiles,
    progress: saved.progress ?? emptyProgress(), // the active progress (guest or signed in)
    work: saved.work ?? {},        // per-question working state
    sets: saved.sets ?? {},        // position in practice sets
    checks: saved.checks ?? {},    // self-check runs
    signup: saved.signup ?? null,  // in-progress profile creation
    flash: null,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'lang': return { ...state, lang: action.lang };
    case 'work': {
      const prev = state.work[action.qid] ?? { answer: '', helpOpen: false, helpStep: 0, helpUsed: [], counted: 0, feedback: null, solved: false };
      const patch = typeof action.patch === 'function' ? action.patch(prev) : action.patch;
      return { ...state, work: { ...state.work, [action.qid]: { ...prev, ...patch } } };
    }
    case 'resetWork': {
      const work = { ...state.work };
      for (const q of action.qids) delete work[q];
      return { ...state, work };
    }
    case 'setIndex': return { ...state, sets: { ...state.sets, [action.set]: action.index } };
    case 'check': {
      const prev = state.checks[action.id] ?? { status: 'intro', index: 0, responses: {} };
      return { ...state, checks: { ...state.checks, [action.id]: { ...prev, ...action.patch } } };
    }
    case 'lessonExplored': {
      if (state.progress.lessons[action.id]?.explored) return state;
      return withProgress(state, { ...state.progress, lessons: { ...state.progress.lessons, [action.id]: { explored: true, at: Date.now() } } });
    }
    case 'attempt':
      return withProgress(state, { ...state.progress, attempts: [...state.progress.attempts, { ...action.attempt, at: Date.now() }] });
    case 'last':
      if (state.progress.last?.href === action.last.href) return state;
      return withProgress(state, { ...state.progress, last: { ...action.last, at: Date.now() } });
    case 'signup': return { ...state, signup: action.signup };
    case 'createProfile': {
      const p = { id: action.id, pw: toyHash(action.password), email: null, emailVerified: false, createdAt: Date.now(), progress: state.progress };
      return { ...state, profiles: { ...state.profiles, [p.id]: p }, profileId: p.id };
    }
    case 'signIn': {
      const p = state.profiles[action.id];
      return { ...state, profileId: p.id, progress: p.progress ?? emptyProgress(), work: {}, sets: {}, checks: {} };
    }
    case 'signOut': return { ...state, profileId: null, progress: emptyProgress(), work: {}, sets: {}, checks: {}, signup: null };
    case 'profilePatch': {
      const p = state.profiles[state.profileId];
      if (!p) return state;
      return { ...state, profiles: { ...state.profiles, [p.id]: { ...p, ...action.patch } } };
    }
    case 'flash': return { ...state, flash: action.flash };
    default: return state;
  }
}

function withProgress(state, progress) {
  const next = { ...state, progress };
  if (state.profileId && state.profiles[state.profileId]) {
    next.profiles = { ...state.profiles, [state.profileId]: { ...state.profiles[state.profileId], progress } };
  }
  return next;
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  useEffect(() => {
    const { lang, profileId, progress, work, sets, checks, signup } = state;
    if (ss()) safeSet(ss(), SS_KEY, { lang, profileId, progress, work, sets, checks, signup });
    if (ls()) safeSet(ls(), LS_KEY, state.profiles);
  }, [state]);

  useEffect(() => { document.documentElement.lang = state.lang; }, [state.lang]);

  const t = useCallback((key, params) => translate(state.lang, key, params), [state.lang]);
  const L = useCallback((v) => pick(state.lang, v), [state.lang]);
  const value = useMemo(() => ({ state, dispatch, t, L, lang: state.lang, profile: state.profileId ? state.profiles[state.profileId] : null }), [state, t, L]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

export function checkCredentials(profiles, id, password) {
  const p = profiles[(id || '').trim().toUpperCase()];
  return p && p.pw === toyHash(password) ? p : null;
}

const ALPH = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // no 0/O, 1/I/L
export function generateLearnerId() {
  const r = new Uint32Array(8);
  try { crypto.getRandomValues(r); } catch { for (let i = 0; i < 8; i++) r[i] = Math.floor(Math.random() * 1e9); }
  const c = [...r].map((n) => ALPH[n % ALPH.length]).join('');
  return `MKX-${c.slice(0, 4)}-${c.slice(4)}`;
}

// ---- Hash router ----------------------------------------------------------
export function useRoute() {
  const get = () => (window.location.hash.replace(/^#/, '') || '/');
  const [path, setPath] = useState(get);
  useEffect(() => {
    const on = () => setPath(get());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const parts = path.split('?')[0].split('/').filter(Boolean);
  return { path, parts };
}
export const go = (href) => { window.location.hash = href.replace(/^#/, ''); };
