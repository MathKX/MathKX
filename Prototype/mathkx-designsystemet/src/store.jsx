import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { translate, pick } from './i18n.js';
import { instance, nextInstance, stepVariant, variants, skills } from './domain/practice.js';

// ---- Simulated persistence ------------------------------------------------
// Everything here is prototype behaviour. Profiles (with their learning record)
// live in this browser's localStorage, standing in for a server. Guest work is
// also kept in this browser only, and the UI says so.
const LS_PROFILES = 'mathkx-proto-profiles-v2';
const LS_GUEST = 'mathkx-proto-guest-v2';
const LS_PREFS = 'mathkx-proto-prefs-v2';

function safeGet(key) { try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } }
function safeSet(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable: memory only */ } }
function safeDel(key) { try { window.localStorage.removeItem(key); } catch { /* ignore */ } }

export const DEMO = { id: 'MKX-DEMO-4K7P', password: 'tiervenner10' };

// Toy hash so the prototype does not store the password verbatim. NOT security.
function toyHash(s) { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }

export const emptyLearner = () => ({ events: [], seq: 0, sessions: {}, deliveries: {}, work: {}, active: {}, last: null, checks: {} });

const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

// ---- Labelled sample history -----------------------------------------------
// Covers every observation type the progress view must explain. Shown with an
// "Example history" label wherever it appears.
export function sampleLearner(now = Date.now()) {
  const L = emptyLearner();
  const day = 864e5;
  const log = (at, e) => { L.seq += 1; L.events.push({ seq: L.seq, at, prov: 'sample', ...e }); };
  const deliver = (at, session, variant, index, repeat = false) => {
    const q = instance(variant, index); const d = `s-${q.id}-${L.seq}`;
    L.deliveries[d] = { id: d, session, q, repeat };
    L.sessions[session].deliveries.push(d);
    log(at, { type: 'delivery', delivery: d, session, qid: q.id, variant, repeat });
    return d;
  };
  let t = now - 3 * day;
  log(t, { type: 'lesson-viewed', lesson: 'number-bonds-to-ten', lang: 'nb' });
  // Session 1: addition within ten
  L.sessions.s1 = { id: 's1', skill: 'arithmetic.add-within-20', variant: 'within-10', mode: 'practice', deliveries: [], startedAt: t + 6e4 };
  log(t += 6e4, { type: 'session-start', session: 's1', skill: 'arithmetic.add-within-20', variant: 'within-10', mode: 'practice' });
  let d = deliver(t += 1e4, 's1', 'within-10', 0); // 4 + 4
  log(t += 2e4, { type: 'response', delivery: d, answer: '8', result: 'correct', code: 'correct' });
  d = deliver(t += 1e4, 's1', 'within-10', 1); // 3 + 5
  log(t += 1e4, { type: 'support', delivery: d, support: 'visual' });
  log(t += 3e4, { type: 'response', delivery: d, answer: '8', result: 'correct', code: 'correct' });
  d = deliver(t += 1e4, 's1', 'within-10', 2); // 6 + 3
  log(t += 2e4, { type: 'response', delivery: d, answer: '8', result: 'incorrect', code: 'add.offByOne' });
  log(t += 2e4, { type: 'response', delivery: d, answer: '9', result: 'correct', code: 'correct' });
  d = deliver(t += 1e4, 's1', 'within-10', 3); // 2 + 7
  log(t += 2e4, { type: 'response', delivery: d, answer: '9', result: 'correct', code: 'correct' });
  log(t += 1e4, { type: 'support', delivery: d, support: 'explanation', step: 2 });
  d = deliver(t += 1e4, 's1', 'within-10', 4); // 5 + 4
  log(t += 1e4, { type: 'skip', delivery: d });
  log(t += 1e4, { type: 'session-end', session: 's1' });
  L.sessions.s1.endedAt = t;
  // Session 2: learner asked for more challenge; left unfinished
  t = now - day;
  L.sessions.s2 = { id: 's2', skill: 'arithmetic.add-within-20', variant: 'across-10', mode: 'practice', deliveries: [], startedAt: t };
  log(t, { type: 'session-start', session: 's2', skill: 'arithmetic.add-within-20', variant: 'across-10', mode: 'practice' });
  log(t += 1e3, { type: 'challenge', session: 's2', from: 'within-10', to: 'across-10', request: 'harder', outcome: 'applied' });
  d = deliver(t += 1e4, 's2', 'across-10', 0); // 8 + 5
  log(t += 2e4, { type: 'support', delivery: d, support: 'answer-reveal', step: 0 });
  log(t += 4e4, { type: 'response', delivery: d, answer: '13', result: 'correct', code: 'correct' });
  d = deliver(t += 1e4, 's2', 'across-10', 1); // 9 + 4, unfinished
  L.work[d] = { answer: '1' };
  L.sessions.s2.current = d;
  L.active['arithmetic.add-within-20'] = 's2';
  L.last = { href: '#/practice/arithmetic.add-within-20', kind: 'practice', skill: 'arithmetic.add-within-20', at: t };
  return L;
}

function demoProfile() {
  return { id: DEMO.id, pw: toyHash(DEMO.password), email: null, emailState: 'none', createdAt: Date.now() - 6 * 864e5, learner: sampleLearner(), sample: true };
}

function initialState() {
  const prefs = safeGet(LS_PREFS) ?? {};
  const profiles = safeGet(LS_PROFILES) ?? {};
  if (!profiles[DEMO.id]) profiles[DEMO.id] = demoProfile();
  const profileId = prefs.profileId && profiles[prefs.profileId] ? prefs.profileId : null;
  const learner = profileId ? (profiles[profileId].learner ?? emptyLearner()) : (safeGet(LS_GUEST) ?? emptyLearner());
  return {
    lang: prefs.lang ?? 'nb',
    profileId,
    profiles,
    learner,
    signup: prefs.signup ?? null,
    returnTo: prefs.returnTo ?? null,
    kbdSim: false,
    pendingGuest: null,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'lang': return { ...state, lang: action.lang };
    case 'learner': {
      const learner = action.learner;
      if (learner === state.learner) return state;
      const next = { ...state, learner };
      if (state.profileId) next.profiles = { ...state.profiles, [state.profileId]: { ...state.profiles[state.profileId], learner } };
      return next;
    }
    case 'signup': return { ...state, signup: action.signup };
    case 'returnTo': return { ...state, returnTo: action.returnTo };
    case 'kbdSim': return { ...state, kbdSim: action.on };
    case 'createProfile': {
      // Guest work in this browser becomes part of the new profile, marked as guest work.
      const learner = { ...state.learner, events: state.learner.events.map((e) => ({ ...e, prov: e.prov === 'guest' ? 'guest' : e.prov })) };
      const p = { id: action.id, pw: toyHash(action.password), email: null, emailState: 'none', createdAt: Date.now(), learner };
      return { ...state, profiles: { ...state.profiles, [p.id]: p }, profileId: p.id, learner, guestCleared: true };
    }
    case 'signIn': {
      const p = state.profiles[action.id];
      let learner = p.learner ?? emptyLearner();
      if (action.guest === 'import' && state.learner.events.length) {
        // Imported guest observations keep their origin; they are not re-labelled as verified profile work.
        const base = learner.seq;
        const imported = state.learner.events.map((e) => ({ ...e, seq: base + e.seq, prov: 'guest-import' }));
        learner = {
          ...learner,
          events: [...learner.events, ...imported],
          seq: base + state.learner.seq,
          // Imported guest sessions become history; the profile's own place is kept.
          sessions: { ...learner.sessions, ...Object.fromEntries(Object.entries(state.learner.sessions).map(([k, v]) => [k, { ...v, endedAt: v.endedAt ?? Date.now(), imported: true }])) },
          deliveries: { ...learner.deliveries, ...state.learner.deliveries },
          work: { ...learner.work, ...state.learner.work },
          active: learner.active,
          last: learner.last ?? state.learner.last,
        };
      }
      return { ...state, profileId: p.id, learner, profiles: { ...state.profiles, [p.id]: { ...p, learner } }, guestCleared: true };
    }
    case 'signOut': return { ...state, profileId: null, learner: emptyLearner(), signup: null, returnTo: null };
    case 'profilePatch': {
      const p = state.profiles[state.profileId];
      if (!p) return state;
      return { ...state, profiles: { ...state.profiles, [p.id]: { ...p, ...action.patch } } };
    }
    case 'resetGuest': return state.profileId ? state : { ...state, learner: emptyLearner() };
    default: return state;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  // Learner updates are computed synchronously against the latest value so that
  // several events logged in one handler keep their order.
  const learnerRef = useRef(state.learner);
  learnerRef.current = state.learner;
  const updateLearner = useCallback((fn) => {
    const next = fn(learnerRef.current);
    if (next !== learnerRef.current) { learnerRef.current = next; dispatch({ type: 'learner', learner: next }); }
    return next;
  }, []);

  useEffect(() => {
    safeSet(LS_PROFILES, state.profiles);
    safeSet(LS_PREFS, { lang: state.lang, profileId: state.profileId, signup: state.signup, returnTo: state.returnTo });
    if (!state.profileId) safeSet(LS_GUEST, state.learner);
    else safeDel(LS_GUEST);
  }, [state]);

  useEffect(() => { document.documentElement.lang = state.lang; }, [state.lang]);

  const t = useCallback((key, params) => translate(state.lang, key, params), [state.lang]);
  const L = useCallback((v) => pick(state.lang, v), [state.lang]);
  const value = useMemo(() => ({ state, dispatch, updateLearner, t, L, lang: state.lang, profile: state.profileId ? state.profiles[state.profileId] : null }), [state, t, L, updateLearner]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

// ---- Learner actions ---------------------------------------------------------
export function useLearner() {
  const { state, updateLearner: up } = useStore();
  const prov = state.profileId ? 'profile' : 'guest';

  return useMemo(() => {
    const logInto = (L, evs) => {
      let seq = L.seq; const at = Date.now();
      const add = evs.map((e) => ({ seq: ++seq, at, prov, ...e }));
      return { ...L, seq, events: [...L.events, ...add] };
    };
    const deliverInto = (L, sessionId, q, repeat) => {
      const d = uid('d');
      const s = L.sessions[sessionId];
      L = { ...L, deliveries: { ...L.deliveries, [d]: { id: d, session: sessionId, q, repeat } }, sessions: { ...L.sessions, [sessionId]: { ...s, deliveries: [...s.deliveries, d], current: d, variant: q.variant } } };
      return logInto(L, [{ type: 'delivery', delivery: d, session: sessionId, qid: q.id, variant: q.variant, repeat }]);
    };
    const seenIn = (L, sessionId, variant) => L.sessions[sessionId].deliveries.map((d) => L.deliveries[d].q).filter((q) => q.variant === variant).map((q) => q.index);

    return {
      log: (evs) => up((L) => logInto(L, Array.isArray(evs) ? evs : [evs])),
      work: (delivery, patch) => up((L) => {
        const prev = L.work[delivery] ?? {};
        const p = typeof patch === 'function' ? patch(prev) : patch;
        return { ...L, work: { ...L.work, [delivery]: { ...prev, ...p } } };
      }),
      /** Start (or resume) a practice session for a skill. */
      startPractice: (skillId, variant, { force = false } = {}) => up((L) => {
        const existing = L.active[skillId];
        if (existing && L.sessions[existing] && !L.sessions[existing].endedAt && !force) return L;
        const v = variant ?? skills[skillId].defaultVariant;
        const sid = uid('s');
        L = { ...L, sessions: { ...L.sessions, [sid]: { id: sid, skill: skillId, variant: v, mode: 'practice', deliveries: [], startedAt: Date.now() } }, active: { ...L.active, [skillId]: sid } };
        L = logInto(L, [{ type: 'session-start', session: sid, skill: skillId, variant: v, mode: 'practice' }]);
        const { q } = nextInstance(v, []);
        return deliverInto(L, sid, q, false);
      }),
      /** Easier / more challenge: chosen now, applied to the next question. The current question stays as it is. */
      challenge: (sessionId, dir) => {
        let outcome = null;
        up((L) => {
          const s = L.sessions[sessionId];
          const base = s.pending ?? L.deliveries[s.current]?.q.variant ?? s.variant;
          const to = stepVariant(base, dir);
          if (!to) { outcome = { kind: 'unavailable', request: dir }; return logInto(L, [{ type: 'challenge', session: sessionId, from: base, to: null, request: dir, outcome: 'unavailable' }]); }
          outcome = { kind: 'pending', request: dir, variant: to };
          L = { ...L, sessions: { ...L.sessions, [sessionId]: { ...s, pending: to } } };
          return logInto(L, [{ type: 'challenge', session: sessionId, from: base, to, request: dir, outcome: 'applied' }]);
        });
        return outcome;
      },
      clearPending: (sessionId) => up((L) => ({ ...L, sessions: { ...L.sessions, [sessionId]: { ...L.sessions[sessionId], pending: null } } })),
      /** request: 'another' (uses a pending challenge change) | 'same' (more like this). */
      next: (sessionId, request) => {
        let outcome = null;
        up((L) => {
          const s = L.sessions[sessionId];
          const cur = L.deliveries[s.current]?.q;
          const v = request === 'same' ? (cur?.variant ?? s.variant) : (s.pending ?? cur?.variant ?? s.variant);
          L = { ...L, sessions: { ...L.sessions, [sessionId]: { ...s, pending: null } } };
          const r = nextInstance(v, seenIn(L, sessionId, v), { same: request === 'same' ? cur?.index : undefined });
          if (r.repeat) L = logInto(L, [{ type: 'challenge', session: sessionId, from: v, to: v, request, outcome: 'repeat' }]);
          outcome = { kind: r.repeat ? 'repeat' : 'applied', request, variant: v, changed: v !== cur?.variant, poolSize: variants[v].pool.length };
          return deliverInto(L, sessionId, r.q, r.repeat);
        });
        return outcome;
      },
      endSession: (sessionId) => up((L) => {
        const s = L.sessions[sessionId];
        if (!s || s.endedAt) return L;
        L = { ...L, sessions: { ...L.sessions, [sessionId]: { ...s, endedAt: Date.now() } }, active: Object.fromEntries(Object.entries(L.active).filter(([, v]) => v !== sessionId)) };
        return logInto(L, [{ type: 'session-end', session: sessionId }]);
      }),
      setLast: (last) => up((L) => (L.last?.href === last.href ? L : { ...L, last: { ...last, at: Date.now() } })),
      check: (id, patch) => up((L) => ({ ...L, checks: { ...L.checks, [id]: { ...(L.checks[id] ?? {}), ...(typeof patch === 'function' ? patch(L.checks[id] ?? {}) : patch) } } })),
      /** Deliver a fixed check question into a check session. */
      deliverFixed: (sessionId, q) => {
        let id = null;
        up((L) => {
          if (!L.sessions[sessionId]) L = { ...L, sessions: { ...L.sessions, [sessionId]: { id: sessionId, skill: q.skill, variant: 'check', mode: 'check', deliveries: [], startedAt: Date.now() } } };
          L = deliverInto(L, sessionId, q, false);
          id = L.sessions[sessionId].current;
          return L;
        });
        return id;
      },
    };
  }, [up, prov]);
}

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
  const [p, query = ''] = path.split('?');
  const parts = p.split('/').filter(Boolean);
  return { path, parts, query: new URLSearchParams(query) };
}
export const go = (href) => { window.location.hash = href.replace(/^#/, ''); };
