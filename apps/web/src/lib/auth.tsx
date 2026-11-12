import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { get, post, setSignedOutHandler } from "./api";

export type Me = {
  id: string; name: string; email: string; role: "system_admin" | "school_admin" | "bcba" | "rbt" | "parent" | "teacher"; role_label: string;
  school: { id: string; name: string } | null; sites: { id: string; name: string }[];
  must_change_password: boolean; tours_done: Record<string, string>; two_factor: boolean; features: { ai?: boolean; voice?: boolean };
};
export type Meta = { env: "demo" | "dev" | "qa" | "prod"; resettable: boolean; version: string;
  personas: { id: string; name: string; role: string; role_label: string; school: string | null }[] };

type Auth = { me: Me | null; meta: Meta | null; ready: boolean; notice: string | null;
  setMe: (m: Me | null) => void; refresh: () => Promise<void>; signOut: (notice?: string) => Promise<void> };
const Ctx = createContext<Auth>(null as any);
export const useAuth = () => useContext(Ctx);
export const HOME: Record<string, string> = { system_admin: "/system", school_admin: "/school", bcba: "/clinic", rbt: "/collect", parent: "/family", teacher: "/family" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => { try { setMe(await get<Me>("/auth/me")); } catch { setMe(null); } }, []);
  const signOut = useCallback(async (why?: string) => {
    try { await post("/auth/logout"); } catch { /* already gone */ }
    setMe(null); setNotice(why ?? null);
  }, []);

  useEffect(() => {
    setSignedOutHandler(() => { setMe(null); setNotice("Your session ended. Please sign in again."); });
    Promise.all([get<Meta>("/meta").then(setMeta).catch(() => {}), refresh()]).finally(() => setReady(true));
  }, [refresh]);

  return <Ctx.Provider value={{ me, meta, ready, notice, setMe: m => { setMe(m); setNotice(null); }, refresh, signOut }}>{children}</Ctx.Provider>;
}
