/* Local-first collection store (ADR-0005).
   Every tap is written to this device first (encrypted at rest), then pushed from an outbox.
   Ids are generated here, so re-sending after a flaky connection can never duplicate data. */
import { useSyncExternalStore } from "react";
import { ApiError, del, get, post } from "../../lib/api";

export type LocalSession = { id: string; student_id: string; kind: "direct" | "probe"; setting: string; started_at: string;
  ended_at: string | null; lock_epoch: number | null; note: string; synced: boolean };
export type LocalObs = { id: string; session_id: string; program_id: string; target_id: string | null;
  kind: "trial" | "event" | "duration" | "window" | "void" | "interval" | "abc" | "step"; outcome: string | null; seconds: number | null; voids: string | null;
  hit?: boolean | null; data?: Record<string, string> | null;
  recorded_at: string; synced: boolean };
type Receipt = { review_state: string; review_why: string; stored: number };
export type State = {
  ready: boolean; userId: string | null; bundle: any | null; bundleAt: string | null;
  sessions: LocalSession[]; obs: LocalObs[]; receipts: Record<string, Receipt>; timers: Record<string, number>;
  lockLost: Record<string, string>; lastSync: string | null; syncing: boolean; simulateOffline: boolean; netOnline: boolean; lastError: string | null;
};

let state: State = { ready: false, userId: null, bundle: null, bundleAt: null, sessions: [], obs: [], receipts: {}, timers: {},
  lockLost: {}, lastSync: null, syncing: false, simulateOffline: false, netOnline: navigator.onLine, lastError: null };
const subs = new Set<() => void>();
const PERSIST: (keyof State)[] = ["bundle", "bundleAt", "sessions", "obs", "receipts", "timers", "lastSync"];

function set(patch: Partial<State>, persist = true) {
  state = { ...state, ...patch };
  subs.forEach(f => f());
  if (persist && state.userId) save();
}
export const useCollect = () => useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb); }, () => state);
export const online = () => state.netOnline && !state.simulateOffline;
export const isBusy = () => state.sessions.some(s => !s.ended_at);
export const pendingCount = (s: State = state) => s.obs.filter(o => !o.synced).length + s.sessions.filter(x => !x.synced).length;
export const deviceId = () => {
  let d = localStorage.getItem("aba.device");
  if (!d) { d = "web-" + crypto.randomUUID().slice(0, 13); localStorage.setItem("aba.device", d); }
  return d;
};

/* ── encrypted persistence: AES-GCM with a non-extractable key kept in IndexedDB ── */
function idb(): Promise<IDBDatabase> {
  return new Promise((ok, bad) => {
    const r = indexedDB.open("aba-collect", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error);
  });
}
async function kv<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await idb();
  return new Promise((ok, bad) => { const r = fn(db.transaction("kv", mode).objectStore("kv")); r.onsuccess = () => ok(r.result as T); r.onerror = () => bad(r.error); });
}
async function key(): Promise<CryptoKey> {
  let k = await kv<CryptoKey | undefined>("readonly", s => s.get("key"));
  if (!k) {
    k = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    await kv("readwrite", s => s.put(k, "key"));
  }
  return k;
}
let saving: Promise<void> = Promise.resolve();
function save() {
  const snapshot = JSON.stringify(Object.fromEntries(PERSIST.map(k => [k, state[k]])));
  const uid = state.userId;
  saving = saving.then(async () => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), new TextEncoder().encode(snapshot));
    await kv("readwrite", s => s.put({ iv, data }, `state:${uid}`));
  }).catch(e => console.error("local save failed", e));
}
export async function clearLocal() {
  try { const db = await idb(); await new Promise(r => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").clear(); t.oncomplete = r; t.onerror = r; }); } catch { /* nothing stored */ }
  state = { ...state, bundle: null, sessions: [], obs: [], receipts: {}, timers: {}, lockLost: {}, lastSync: null };
}

/* ── lifecycle ── */
let wired = false;
export async function init(userId: string) {
  if (state.userId === userId && state.ready) { refreshBundle(); return; }
  set({ userId, ready: false, sessions: [], obs: [], receipts: {}, timers: {}, bundle: null }, false);
  try {
    const box = await kv<{ iv: Uint8Array; data: ArrayBuffer } | undefined>("readonly", s => s.get(`state:${userId}`));
    if (box) {
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: box.iv as BufferSource }, await key(), box.data);
      set(JSON.parse(new TextDecoder().decode(plain)), false);
    }
  } catch (e) { console.error("local load failed", e); }
  set({ ready: true }, false);
  if (!wired) {
    wired = true;
    window.addEventListener("online", () => { set({ netOnline: true }, false); sync(); });
    window.addEventListener("offline", () => set({ netOnline: false }, false));
    setInterval(heartbeat, 60_000);
    setInterval(() => { if (pendingCount()) sync(); }, 15_000);
  }
  await refreshBundle();
  sync();
}
export async function refreshBundle() {
  if (!online()) return;
  try { set({ bundle: await get("/collect/bundle"), bundleAt: new Date().toISOString(), lastError: null }); }
  catch (e: any) { if (e.status !== 0) set({ lastError: e.message }, false); }
}
export function setSimulateOffline(v: boolean) { set({ simulateOffline: v }, false); if (!v) { sync(); refreshBundle(); } }

/* ── sessions ── */
export const activeSession = (studentId: string, s: State = state) => s.sessions.find(x => x.student_id === studentId && !x.ended_at) ?? null;

export async function startSession(studentId: string, kind: "direct" | "probe", setting: string, takeover = false): Promise<LocalSession> {
  let epoch: number | null = null;      // null = provisional lock taken offline; the server decides at sync
  if (online()) {
    try { epoch = (await post(`/collect/students/${studentId}/lock`, { device_id: deviceId(), takeover })).epoch; }
    catch (e) { if (!(e instanceof ApiError) || e.status !== 0) throw e; }
  }
  const s: LocalSession = { id: crypto.randomUUID(), student_id: studentId, kind, setting, started_at: new Date().toISOString(),
    ended_at: null, lock_epoch: epoch, note: "", synced: false };
  const lockLost = { ...state.lockLost }; delete lockLost[studentId];
  set({ sessions: [...state.sessions, s], lockLost });
  sync();
  return s;
}

export function record(session: LocalSession, o: Partial<LocalObs> & { program_id: string; kind: LocalObs["kind"] }) {
  const row: LocalObs = { id: crypto.randomUUID(), session_id: session.id, target_id: null, outcome: null, seconds: null, voids: null,
    recorded_at: new Date().toISOString(), synced: false, ...o };
  set({ obs: [...state.obs, row] });
  navigator.vibrate?.(12);
  scheduleSync();
  return row;
}
/** Live (non-voided) observations of a program in a session, oldest first. */
export function liveObs(sessionId: string, programId: string, s: State = state) {
  const mine = s.obs.filter(o => o.session_id === sessionId && o.program_id === programId);
  const voided = new Set(mine.filter(o => o.kind === "void").map(o => o.voids));
  return mine.filter(o => o.kind !== "void" && o.kind !== "window" && !voided.has(o.id));
}
export function undoLast(session: LocalSession, programId: string) {
  const last = liveObs(session.id, programId).pop();
  if (!last) return null;
  record(session, { program_id: programId, kind: "void", voids: last.id, target_id: last.target_id });
  return last;
}
export function setTimer(programId: string, startedMs: number | null) {
  const timers = { ...state.timers };
  if (startedMs) timers[programId] = startedMs; else delete timers[programId];
  set({ timers });
}
export async function endSession(session: LocalSession, note: string, programs: any[]) {
  const end = new Date(), secs = Math.max(1, Math.round((+end - +new Date(session.started_at)) / 1000));
  // behaviours tracked continuously get an observation window, so "zero today" is real data
  programs.filter(p => p.kind !== "trial").forEach(p => record(session, { program_id: p.id, kind: "window", seconds: secs }));
  set({ sessions: state.sessions.map(s => s.id === session.id ? { ...s, ended_at: end.toISOString(), note, synced: false } : s) });
  if (online()) del(`/collect/students/${session.student_id}/lock?device_id=${encodeURIComponent(deviceId())}`).catch(() => {});
  await sync();
  refreshBundle();
}

/* ── sync ── */
let timer: number | undefined;
function scheduleSync() { clearTimeout(timer); timer = window.setTimeout(sync, 500); }
export async function sync(): Promise<void> {
  if (!online() || state.syncing || !state.userId || !pendingCount()) return;
  const sessions = state.sessions.filter(s => !s.synced), obs = state.obs.filter(o => !o.synced).slice(0, 2000);
  const sessIds = new Set([...sessions.map(s => s.id), ...obs.map(o => o.session_id)]);
  set({ syncing: true }, false);
  try {
    const strip = ({ synced, ...rest }: any) => rest;
    const res = await post("/collect/sync", { device_id: deviceId(),
      sessions: state.sessions.filter(s => sessIds.has(s.id)).map(strip), observations: obs.map(strip) });
    const sent = new Set(obs.map(o => o.id)), sentS = new Map(sessions.map(s => [s.id, s.ended_at]));
    const day = Date.now() - 86_400_000;
    const nextObs = state.obs.map(o => sent.has(o.id) ? { ...o, synced: true } : o);
    const nextSess = state.sessions.map(s => sentS.has(s.id) && sentS.get(s.id) === s.ended_at ? { ...s, synced: true } : s)
      // forget finished, fully confirmed sessions after a day — the server is the record
      .filter(s => !(s.ended_at && s.synced && +new Date(s.ended_at) < day && !nextObs.some(o => o.session_id === s.id && !o.synced)));
    const keep = new Set(nextSess.map(s => s.id));
    set({ obs: nextObs.filter(o => keep.has(o.session_id)), sessions: nextSess, receipts: { ...state.receipts, ...res.sessions },
      lastSync: new Date().toISOString(), syncing: false, lastError: null });
    if (pendingCount()) scheduleSync();
  } catch (e: any) {
    set({ syncing: false, lastError: e.status === 0 ? null : e.message, ...(e.status === 0 ? { netOnline: navigator.onLine } : {}) }, false);
  }
}
async function heartbeat() {
  if (!online()) return;
  for (const s of state.sessions.filter(x => !x.ended_at)) {
    try {
      const r = await post(`/collect/students/${s.student_id}/heartbeat`, { device_id: deviceId() });
      if (!r.held && r.holder) set({ lockLost: { ...state.lockLost, [s.student_id]: r.holder } }, false);
    } catch { /* offline or signed out: sync will sort it out */ }
  }
}
export const checkLock = heartbeat;
