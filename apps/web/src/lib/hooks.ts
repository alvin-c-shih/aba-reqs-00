import { useCallback, useEffect, useRef, useState } from "react";
import { get } from "./api";

/** Load JSON from the API. Returns data, error, loading and a reload function. */
export function useData<T = any>(path: string | null) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: !!path });
  const seq = useRef(0);
  const reload = useCallback(async () => {
    if (!path) return;
    const mine = ++seq.current;
    try {
      const data = await get<T>(path);
      if (mine === seq.current) setState({ data, error: null, loading: false });
    } catch (e: any) {
      if (mine === seq.current) setState(s => ({ data: s.data, error: e.message, loading: false }));
    }
  }, [path]);
  useEffect(() => { setState(s => ({ ...s, loading: !!path })); reload(); }, [reload, path]);
  return { ...state, reload };
}

export const fmtDate = (iso?: string | null) => iso ? new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" }) : "—";
export const fmtDateTime = (iso?: string | null) => iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
export function ago(iso?: string | null) {
  if (!iso) return "never";
  const s = (Date.now() - +new Date(iso)) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
}
/** Students are shown as first name + last initial everywhere (shoulder-surfing in classrooms). */
export const studentName = (s: { first_name: string; last_name: string }) => `${s.first_name} ${s.last_name[0]}.`;
