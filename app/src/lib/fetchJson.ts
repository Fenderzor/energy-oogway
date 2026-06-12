/**
 * Fetch a JSON file relative to the app base URL (works under any deploy path).
 * Pass `{ bust: true }` to force a fresh copy past the HTTP and service-worker caches.
 */
export async function fetchJson<T>(path: string, opts?: { bust?: boolean }): Promise<T> {
  const url = import.meta.env.BASE_URL + path + (opts?.bust ? `?t=${Date.now()}` : '')
  const res = await fetch(url, { cache: opts?.bust ? 'reload' : 'no-cache' })
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`)
  return (await res.json()) as T
}
