/* One fetch wrapper for the whole app: same-origin cookies, CSRF header on every call,
   one silent token refresh on 401, and errors as plain messages. */
export class ApiError extends Error {
  constructor(public status: number, message: string, public data: any = {}) { super(message); }
}

let onSignedOut: () => void = () => {};
export const setSignedOutHandler = (fn: () => void) => { onSignedOut = fn; };
let refreshing: Promise<boolean> | null = null;

async function raw(method: string, path: string, body?: unknown): Promise<Response> {
  return fetch(`/api/v1${path}`, {
    method, credentials: "same-origin",
    headers: { "x-aba-csrf": "1", ...(body !== undefined ? { "content-type": "application/json" } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function api<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try { res = await raw(method, path, body); }
  catch { throw new ApiError(0, "You appear to be offline"); }
  if (res.status === 401 && !path.startsWith("/auth/")) {
    refreshing ??= raw("POST", "/auth/refresh").then(r => r.ok).catch(() => false).finally(() => { refreshing = null; });
    if (await refreshing) res = await raw(method, path, body);
    else { onSignedOut(); throw new ApiError(401, "Signed out"); }
  }
  const data = res.status === 204 ? null : await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message ?? (Array.isArray(data?.detail) ? data.detail.map((d: any) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join("; ") : "Request failed");
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}
/** Send a file as the raw request body (photos, short videos, voice notes). */
export async function upload<T = any>(path: string, file: Blob): Promise<T> {
  const res = await fetch(`/api/v1${path}`, { method: "POST", credentials: "same-origin", headers: { "x-aba-csrf": "1", "content-type": file.type }, body: file })
    .catch(() => { throw new ApiError(0, "You appear to be offline"); });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data?.message ?? "Upload failed", data);
  return data as T;
}
export const get = <T = any>(p: string) => api<T>("GET", p);
export const post = <T = any>(p: string, b: unknown = {}) => api<T>("POST", p, b);
export const patch = <T = any>(p: string, b: unknown) => api<T>("PATCH", p, b);
export const put = <T = any>(p: string, b: unknown = {}) => api<T>("PUT", p, b);
export const del = <T = any>(p: string) => api<T>("DELETE", p);
