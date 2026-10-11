"use client";
export class RequestError extends Error { constructor(message: string, public status: number, public fields?: Record<string, string[]>) { super(message); } }
export async function request<T>(path: string, options: { method?: string; body?: unknown; csrf?: string } = {}): Promise<T> {
  let res: Response;
  try { res = await fetch("/api/v1/" + path, { method: options.method || "GET", cache: "no-store", credentials: "same-origin", headers: { "Content-Type": "application/json", ...(options.csrf ? { "X-CSRF-Token": options.csrf } : {}) }, ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}) }); }
  catch { throw new RequestError("Koneksi terputus. Isianmu tetap di layar; coba lagi saat tersambung.", 0); }
  if (res.status === 204) return undefined as T;
  const payload = await res.json();
  if (!res.ok) { if (res.status === 401 && !path.startsWith("auth/")) window.dispatchEvent(new Event("pause-session-expired")); throw new RequestError(payload.error?.message || "Belum berhasil. Coba lagi.", res.status, payload.error?.fields); }
  return payload.data as T;
}
